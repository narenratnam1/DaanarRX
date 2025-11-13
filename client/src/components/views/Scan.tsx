import React, { useState } from 'react';
import { YStack, XStack, Button, Input, Text, H2, H3, Card } from 'tamagui';
import { Camera } from 'lucide-react';
import { ViewType, Unit } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import BarcodeScanner from '../shared/BarcodeScanner';
import UnitPreviewModal from '../shared/UnitPreviewModal';

interface ScanProps {
  onNavigate: (view: ViewType) => void;
  onCheckOutUnit?: (unitId: string) => void;
}

const Scan: React.FC<ScanProps> = ({ onNavigate, onCheckOutUnit }) => {
  const { locations } = useFirebase();
  
  const [scanInput, setScanInput] = useState('');
  const [foundUnit, setFoundUnit] = useState<Unit | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUnit, setPreviewUnit] = useState<Unit | null>(null);
  const [previewLocationName, setPreviewLocationName] = useState('');

  const handleScanLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    let unitIdToFind = scanInput.trim();
    if (!unitIdToFind) return;
    
    try {
      // Check if scanned data is JSON (QR code data)
      let parsedData: any = null;
      let isQRCode = false;
      
      try {
        parsedData = JSON.parse(unitIdToFind);
        isQRCode = true;
        console.log('📱 Parsed QR code data:', parsedData);
        
        // Extract unit_id from QR code data
        if (parsedData.u) {
          unitIdToFind = parsedData.u;
          console.log('✅ Using Daana ID from QR code:', unitIdToFind);
        }
      } catch {
        // Not JSON, treat as plain Daana ID
        console.log('🔍 Treating as plain Daana ID:', unitIdToFind);
      }
      
      // Try two search strategies:
      // 1. Search by unit_id (most common)
      let q = query(collection(db, 'units'), where('daana_id', '==', unitIdToFind));
      let querySnapshot = await getDocs(q);
      
      // 2. If QR code and not found by unit_id, try searching by qr_code_value
      if (querySnapshot.empty && isQRCode) {
        console.log('🔄 Trying QR code value search...');
        q = query(collection(db, 'units'), where('qr_code_value', '==', scanInput.trim()));
        querySnapshot = await getDocs(q);
      }
      
      if (querySnapshot.empty || !querySnapshot.docs[0]) {
        setFoundUnit(null);
        setNotFound(true);
        setErrorMsg(`Daana ID "${unitIdToFind}" not found.`);
      } else {
        const doc = querySnapshot.docs[0];
        const unit: Unit = { id: doc.id, ...doc.data() } as Unit;
        setFoundUnit(unit);
        setNotFound(false);
        
        // If we parsed QR data, log verification info
        if (parsedData) {
          console.log('✅ QR code verified!');
          console.log('   Generic:', parsedData.g);
          console.log('   Strength:', parsedData.s);
          console.log('   Form:', parsedData.f);
          console.log('   Expires:', parsedData.x);
          console.log('   Location:', parsedData.loc);
          console.log('   Found unit:', unit.med_generic);
        }
      }
    } catch (error) {
      console.error('Error looking up unit:', error);
      setFoundUnit(null);
      setNotFound(true);
      setErrorMsg('Error looking up unit. Please try again.');
    }
  };

  const handleCheckOut = () => {
    if (foundUnit) {
      // Show preview modal before checkout
      const locationName = getLocationName(foundUnit.location_id);
      console.log('✅ Showing preview modal for unit:', foundUnit.daana_id);
      setPreviewUnit(foundUnit);
      setPreviewLocationName(locationName);
      setShowPreviewModal(true);
    }
  };
  
  const handlePreviewConfirm = () => {
    // After confirming preview, navigate to checkout
    if (previewUnit && onCheckOutUnit) {
      onCheckOutUnit(previewUnit.daana_id);
    }
    onNavigate('check-out');
  };

  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'N/A';
  };

  const handleBarcodeScanned = async (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    // Ignore empty scans or very short scans (likely noise)
    if (!barcode || !barcode.trim() || barcode.trim().length < 3) {
      console.log('❌ Invalid/empty barcode, ignoring:', barcode);
      return;
    }
    
    setScanInput(barcode);
    
    // Try to parse QR code JSON
    let extractedDaanaId = barcode.trim();
    try {
      const parsedData = JSON.parse(barcode);
      if (parsedData.u) {
        extractedDaanaId = parsedData.u;
        console.log('✅ Extracted Daana ID from QR:', extractedDaanaId);
      }
    } catch {
      // Not JSON, use as-is
      console.log('🔍 Using as plain Daana ID:', extractedDaanaId);
    }
    
    // Find the unit
    let unit: Unit | null = null;
    const q = query(collection(db, 'units'), where('daana_id', '==', extractedDaanaId));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty && querySnapshot.docs[0]) {
      const foundDoc = querySnapshot.docs[0];
      unit = { id: foundDoc.id, ...foundDoc.data() } as Unit;
    } else {
      // Try by qr_code_value
      const qrQuery = query(collection(db, 'units'), where('qr_code_value', '==', barcode));
      const qrSnapshot = await getDocs(qrQuery);
      
      if (!qrSnapshot.empty && qrSnapshot.docs[0]) {
        const foundDoc = qrSnapshot.docs[0];
        unit = { id: foundDoc.id, ...foundDoc.data() } as Unit;
      }
    }
    
    // Only show modal if unit was found - silently ignore not found
    if (unit) {
      const locationName = getLocationName(unit.location_id);
      console.log('✅ Showing preview modal for unit:', unit.daana_id);
      setFoundUnit(unit);
      setNotFound(false);
      setErrorMsg('');
      setPreviewUnit(unit);
      setPreviewLocationName(locationName);
      setShowScanner(false); // Close scanner first
      setTimeout(() => {
        setShowPreviewModal(true);
      }, 100); // Small delay to ensure scanner closes first
    } else {
      // Unit not found - just log it, don't show error modal
      console.log('⚠️ Unit not found for ID:', extractedDaanaId);
      setNotFound(true);
      setErrorMsg('No unit found with this ID or QR code.');
    }
  };

  return (
    <YStack flex={1} space="$4" paddingVertical="$4">
      <Button 
        onPress={() => onNavigate('home')}
        backgroundColor="$gray"
        color="white"
        size="$4"
        alignSelf="flex-start"
        hoverStyle={{ backgroundColor: "#4b5563" }}
        pressStyle={{ backgroundColor: "#374151" }}
        icon={<Text>←</Text>}
        $xs={{ width: "100%" }}
      >
        Back to Home
      </Button>
      
      <H2 fontSize="$9" fontWeight="600" color="$color" $xs={{ fontSize: "$8" }}>
        Scan / Lookup
      </H2>
      
      {/* Camera Scan Input */}
      <Card 
        elevate
        backgroundColor="$background"
        padding="$6"
        borderRadius="$4"
        maxWidth={500}
        width="100%"
        marginHorizontal="auto"
        marginBottom="$6"
        $xs={{ maxWidth: "100%" }}
      >
        <YStack space="$3">
          <Text fontSize="$3" color="$gray">
            Scan the QR code on the DaanaRX label or enter the Daana ID manually.
          </Text>
          <form onSubmit={handleScanLookup} style={{ width: '100%' }}>
            <YStack space="$3">
              <XStack space="$2" $xs={{ flexDirection: "column" }}>
                <Input 
                  flex={1}
                  size="$4"
                  value={scanInput}
                  onChangeText={setScanInput}
                  placeholder="Enter DaanaRX Daana ID (e.g., UNIT-123...)"
                  borderColor="$borderColor"
                  focusStyle={{ borderColor: "$blue" }}
                  $xs={{ width: "100%" }}
                />
                <Button 
                  size="$4"
                  backgroundColor="$blue"
                  color="white"
                  hoverStyle={{ opacity: 0.9 }}
                  pressStyle={{ opacity: 0.8 }}
                  $xs={{ width: "100%" }}
                  onPress={() => handleScanLookup()}
                >
                  Lookup
                </Button>
              </XStack>
              
              {/* Camera Scan Button */}
              <Button 
                size="$5"
                backgroundColor="$green"
                color="white"
                icon={<Camera size={24} />}
                hoverStyle={{ opacity: 0.9 }}
                pressStyle={{ opacity: 0.8 }}
                onPress={() => setShowScanner(true)}
              >
                <Text fontWeight="500">Scan QR Code with Camera</Text>
              </Button>
              
              <Text fontSize="$2" textAlign="center" color="$gray">
                Works with DaanaRX QR codes and NDC barcodes
              </Text>
            </YStack>
          </form>
        </YStack>
      </Card>
      
      {/* Scan Results */}
      <YStack maxWidth={500} width="100%" marginHorizontal="auto" $xs={{ maxWidth: "100%" }}>
        {/* IF FOUND */}
        {foundUnit && (
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
            <H3 fontSize="$8" fontWeight="700" color="$color">
              {foundUnit.med_generic} {foundUnit.strength} {foundUnit.form}
            </H3>
            
            <XStack flexWrap="wrap" gap="$4" $xs={{ flexDirection: "column" }}>
              <YStack flex={1} minWidth={120}>
                <Text fontSize="$3" fontWeight="500" color="$gray">Qty Remaining</Text>
                <Text fontSize="$7" fontWeight="600">{foundUnit.qty_total}</Text>
              </YStack>
              <YStack flex={1} minWidth={120}>
                <Text fontSize="$3" fontWeight="500" color="$gray">Status</Text>
                <Text fontSize="$7" fontWeight="600" textTransform="capitalize">
                  {foundUnit.status.replace('_', ' ')}
                </Text>
              </YStack>
              <YStack flex={1} minWidth={120}>
                <Text fontSize="$3" fontWeight="500" color="$gray">Expires</Text>
                <Text fontSize="$7" fontWeight="600">{foundUnit.exp_date}</Text>
              </YStack>
              <YStack flex={1} minWidth={120}>
                <Text fontSize="$3" fontWeight="500" color="$gray">Location</Text>
                <Text fontSize="$7" fontWeight="600">{getLocationName(foundUnit.location_id)}</Text>
              </YStack>
            </XStack>
            
            {/* Contextual Buttons */}
            <YStack space="$3" borderTopWidth={1} borderTopColor="$borderColor" paddingTop="$4">
              <Button 
                size="$5"
                onPress={handleCheckOut}
                disabled={!['in_stock', 'partial'].includes(foundUnit.status)}
                backgroundColor={['in_stock', 'partial'].includes(foundUnit.status) ? "$green" : "$gray"}
                color="white"
                hoverStyle={{ opacity: ['in_stock', 'partial'].includes(foundUnit.status) ? 0.9 : 1 }}
                pressStyle={{ opacity: ['in_stock', 'partial'].includes(foundUnit.status) ? 0.8 : 1 }}
                cursor={['in_stock', 'partial'].includes(foundUnit.status) ? "pointer" : "not-allowed"}
                opacity={['in_stock', 'partial'].includes(foundUnit.status) ? 1 : 0.6}
              >
                <Text fontSize="$6" fontWeight="500">Check Out This Item</Text>
              </Button>
              <Button 
                size="$4"
                disabled
                backgroundColor="$gray"
                color="white"
                opacity={0.5}
                cursor="not-allowed"
              >
                Move (Not Implemented)
              </Button>
              <Button 
                size="$4"
                disabled
                backgroundColor="$gray"
                color="white"
                opacity={0.5}
                cursor="not-allowed"
              >
                Adjust (Not Implemented)
              </Button>
              <Button 
                size="$4"
                disabled
                backgroundColor="$gray"
                color="white"
                opacity={0.5}
                cursor="not-allowed"
              >
                View History (Not Implemented)
              </Button>
            </YStack>
          </Card>
        )}
        
        {/* IF NOT FOUND */}
        {notFound && (
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" alignItems="center" space="$4">
            <H3 fontSize="$7" fontWeight="600" color="$red">Unit Not Found</H3>
            <Text color="$color" textAlign="center">{errorMsg}</Text>
            <Button 
              size="$5"
              backgroundColor="$blue"
              color="white"
              onPress={() => onNavigate('check-in')}
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              width="100%"
            >
              <Text fontSize="$6" fontWeight="500">Check In as New Item?</Text>
            </Button>
          </Card>
        )}
      </YStack>
      
      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title="Scan QR Code / Barcode"
      />
      
      {/* Unit Preview Modal */}
      <UnitPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handlePreviewConfirm}
        unit={previewUnit}
        locationName={previewLocationName}
      />
    </YStack>
  );
};

export default Scan;

