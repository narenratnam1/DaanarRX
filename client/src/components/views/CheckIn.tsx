import React, { useState, useEffect, useRef } from 'react';
import { YStack, XStack, Button, Input, TextArea, Text, H2, H3, Card, Label, Select, Adapt, Sheet } from 'tamagui';
import { Camera, Check, ChevronDown } from 'lucide-react';
import { ViewType, Unit } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { collection, addDoc, doc, writeBatch, serverTimestamp, getDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PrintLabelModal from '../shared/PrintLabelModal';
import Modal from '../shared/Modal';
import BarcodeScanner from '../shared/BarcodeScanner';
import DateInput from '../shared/DateInput';
import QRCode from 'qrcode';
import { useToast } from '../../context/ToastContext';

interface CheckInProps {
  onNavigate: (view: ViewType) => void;
  onShowLabel: (unit: Unit) => void;
}

const CheckIn: React.FC<CheckInProps> = ({ onNavigate, onShowLabel }) => {
  const { locations, lots, userId } = useFirebase();
  const toast = useToast();
  
  // Lot form state
  const [lotDate, setLotDate] = useState('');
  const [lotSource, setLotSource] = useState('');
  const [lotNotes, setLotNotes] = useState('');
  
  // Unit form state
  const [selectedLotId, setSelectedLotId] = useState('');
  const [ndcScanInput, setNdcScanInput] = useState('');
  const [ndcLookupStatus, setNdcLookupStatus] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [fieldsLocked, setFieldsLocked] = useState(true);
  
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [strength, setStrength] = useState('');
  const [form, setForm] = useState('');
  const [ndc, setNdc] = useState('');
  const [qty, setQty] = useState('');
  const [expDate, setExpDate] = useState('');
  const [locationId, setLocationId] = useState('');
  
  // Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [createdUnit, setCreatedUnit] = useState<Unit | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setLotDate(today);
  }, []);

  const showInfoModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const lotData = {
        date_received: lotDate,
        source_donor: lotSource,
        notes: lotNotes,
        received_by_user_id: userId,
        created_at: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'lots'), lotData);
      toast.success('Lot created successfully!', 3000);
      showInfoModal('Success', `Lot created successfully.`);
      setSelectedLotId(docRef.id);
      setLotDate(new Date().toISOString().split('T')[0]);
      setLotSource('');
      setLotNotes('');
    } catch (error: any) {
      console.error('Error adding lot:', error);
      showInfoModal('Error', `Could not add lot: ${error.message}`);
    }
  };

  const handleNdcLookup = async () => {
    const ndcValue = ndcScanInput.trim();
    if (!ndcValue) return;
    
    setNdcLookupStatus('🔍 Searching Local DB...');
    setFieldsLocked(true);
    setShowFallback(false);
    
    try {
      // Normalize NDC for local search (remove dashes)
      const normalizedNdc = ndcValue.replace(/\D/g, '');
      
      // Try exact match first
      let ndcDoc = await getDoc(doc(db, 'ndc_formulary', ndcValue));
      
      // If not found, try without dashes
      if (!ndcDoc.exists() && normalizedNdc !== ndcValue) {
        ndcDoc = await getDoc(doc(db, 'ndc_formulary', normalizedNdc));
      }
      
      if (ndcDoc.exists()) {
        const drug = ndcDoc.data();
        autoFillForm(drug, ndcValue, 'Local DB');
        return;
      }
      
      // Check openFDA
      setNdcLookupStatus('🌐 Searching openFDA (trying multiple formats)...');
      const fdaResponse = await fetch(`/api/ndc/${ndcValue}`);
      
      if (fdaResponse.ok) {
        const fdaData = await fdaResponse.json();
        if (fdaData.success) {
          autoFillForm(fdaData.data, ndcValue, 'openFDA');
          return;
        }
      }
      
      // Get error message from response
      const errorData = await fdaResponse.json().catch(() => ({ message: 'NDC not found' }));
      throw new Error(errorData.message || 'NDC not found in any database');
    } catch (error: any) {
      console.error('Error fetching NDC:', error);
      setNdcLookupStatus(`❌ ${error.message}. Try searching by name or enter manually.`);
      clearForm();
      setNdc(ndcValue);
      setShowFallback(true);
    }
  };

  const autoFillForm = (drugData: any, ndcValue: string, source: string) => {
    setGenericName(drugData.med_generic || drugData.genericName || 'N/A');
    setBrandName(drugData.med_brand || drugData.brandName || 'N/A');
    setStrength(drugData.strength || 'N/A');
    setForm(drugData.form || 'N/A');
    setNdc(ndcValue);
    setNdcLookupStatus(`Found: ${drugData.med_brand || drugData.brandName} (${source})`);
    setFieldsLocked(true);
    setShowFallback(false);
  };

  const clearForm = () => {
    setGenericName('');
    setBrandName('');
    setStrength('');
    setForm('');
    setNdc('');
  };

  const performSearch = async (searchTerm: string) => {
    // Search both local Firestore and FDA database
    try {
      setIsSearching(true);
      const searchTermLower = searchTerm.toLowerCase();

      // 1. Search local Firestore database
      const q = query(
        collection(db, 'ndc_formulary'),
        where('med_generic', '>=', searchTermLower),
        where('med_generic', '<=', searchTermLower + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      const localResults: any[] = [];
      querySnapshot.forEach((doc) => {
        localResults.push({
          id: doc.id,
          ...doc.data(),
          source: 'local'
        });
      });

      // 2. Search RxNorm database via backend API (only if 2+ characters)
      if (searchTerm.length >= 2) {
        try {
          const rxnormResponse = await fetch(
            `http://localhost:4000/api/search/generic/${encodeURIComponent(searchTerm)}?limit=20`
          );

          if (rxnormResponse.ok) {
            const rxnormData = await rxnormResponse.json();

            if (rxnormData.success && rxnormData.data) {
              // Map RxNorm results to match our format
              const rxnormResults = rxnormData.data.map((drug: any) => ({
                med_generic: drug.genericName,
                med_brand: drug.brandName,
                strength: drug.strength,
                form: drug.form,
                ndc: drug.ndc,
                rxcui: drug.rxcui,
                source: 'rxnorm'
              }));

              // Combine local and RxNorm results, removing duplicates by generic name
              const combinedResults = [...localResults];
              const existingNames = new Set(localResults.map(r => r.med_generic?.toLowerCase()));

              rxnormResults.forEach((rxnormResult: any) => {
                const genericNameLower = rxnormResult.med_generic?.toLowerCase();
                if (!existingNames.has(genericNameLower)) {
                  combinedResults.push(rxnormResult);
                  existingNames.add(genericNameLower);
                }
              });

              console.log(`🔍 Found ${localResults.length} local + ${rxnormResults.length} RxNorm results`);
              setSearchResults(combinedResults);
              setIsSearching(false);
              return;
            }
          }
        } catch (rxnormError) {
          console.error('Error searching RxNorm database:', rxnormError);
          // Continue with just local results
        }
      }

      // Use just local results (if RxNorm search hasn't happened or failed)
      setSearchResults(localResults);
      setIsSearching(false);

    } catch (error) {
      console.error('Error searching formulary:', error);
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const handleNameSearch = (searchTerm: string) => {
    setNameSearch(searchTerm);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Clear results if search is empty
    if (searchTerm.length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Set searching state immediately
    setIsSearching(true);

    // Debounce the actual search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm);
    }, 300);
  };

  const handleChipClick = (drug: any) => {
    const source = drug.source === 'rxnorm' ? 'RxNorm (NIH/NLM)' : 'Local DB';
    autoFillForm(drug, drug.ndc, source);
    setShowFallback(false);
  };

  const handleEnterManually = () => {
    setFieldsLocked(false);
    setShowFallback(false);
  };

  const handleBarcodeScanned = (barcode: string) => {
    console.log('Barcode scanned:', barcode);
    
    // Ignore empty scans
    if (!barcode || !barcode.trim()) {
      console.log('❌ Empty barcode, ignoring');
      return;
    }
    
    setNdcScanInput(barcode);
    // Automatically trigger lookup after scan
    setTimeout(() => {
      handleNdcLookup();
    }, 100);
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const locationName = locations.find(l => l.id === locationId)?.name || 'N/A';
      const isManualEntry = !fieldsLocked;
      
      const unitData: any = {
        daana_id: `UNIT-${Date.now()}`,
        lot_id: selectedLotId,
        med_generic: genericName,
        med_brand: brandName,
        strength: strength,
        form: form,
        ndc: ndc,
        qty_total: parseInt(qty, 10),
        exp_date: expDate,
        location_id: locationId,
        location_name: locationName,
        status: 'in_stock',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        qr_code_value: ''
      };
      
      // Generate QR code data as JSON string
      const qrData = JSON.stringify({
        u: unitData.daana_id,
        l: unitData.lot_id.substring(0, 10),
        g: unitData.med_generic,
        s: unitData.strength,
        f: unitData.form,
        x: unitData.exp_date,
        loc: locationName
      });
      
      // Store the JSON data in qr_code_value (for scanning)
      unitData.qr_code_value = qrData;

      // Generate QR code image locally as base64 data URL
      try {
        unitData.qr_code_image = await QRCode.toDataURL(qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
      } catch (qrError) {
        console.error('Error generating QR code:', qrError);
        // Fallback to a simple placeholder if QR generation fails
        unitData.qr_code_image = '';
      }

      const batch = writeBatch(db);
      
      const unitRef = doc(collection(db, 'units'));
      batch.set(unitRef, unitData);
      
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        daana_id: unitData.daana_id,
        type: 'check_in',
        qty: unitData.qty_total,
        by_user_id: userId,
        reason_note: 'Initial stock check-in',
        timestamp: serverTimestamp()
      });
      
      // Save to local formulary if manual entry
      if (isManualEntry && ndc) {
        const ndcDocRef = doc(db, 'ndc_formulary', ndc);
        batch.set(ndcDocRef, {
          med_generic: genericName,
          med_brand: brandName,
          strength: strength,
          form: form,
          ndc: ndc,
          last_updated: serverTimestamp()
        }, { merge: true });
      }
      
      await batch.commit();

      const createdUnitData = { ...unitData, id: unitRef.id } as Unit;
      setCreatedUnit(createdUnitData);

      toast.success('Unit added successfully! Label generated.', 3000);

      // Navigate to label display screen
      onShowLabel(createdUnitData);
      
      // Reset form
      setNdcScanInput('');
      setNdcLookupStatus('');
      clearForm();
      setQty('');
      setExpDate('');
      setLocationId('');
      setFieldsLocked(true);
      setShowFallback(false);
    } catch (error: any) {
      console.error('Error adding unit:', error);
      showInfoModal('Error', `Could not add unit: ${error.message}`);
    }
  };

  return (
    <YStack flex={1} space="$6" paddingVertical="$4">
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
        Check In Stock
      </H2>
      
      {/* Step 1: Add Lot */}
      <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
        <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
          Step 1: Create a New Lot
        </H3>
        <YStack space="$4" tag="form" onSubmit={(e: any) => { e.preventDefault(); handleAddLot(e); }}>
          <XStack flexWrap="wrap" gap="$4" $xs={{ flexDirection: "column" }} $sm={{ flexDirection: "column" }}>
            <YStack space="$2" flex={1} minWidth={200} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Date Received</Label>
              <DateInput 
                size={4}
                value={lotDate}
                onChange={setLotDate}
                required
              />
            </YStack>
            <YStack space="$2" flex={1} minWidth={200} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Source/Donor</Label>
              <Input 
                size="$4"
                value={lotSource}
                onChangeText={setLotSource}
                placeholder="e.g., Main Donation"
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
                required
              />
            </YStack>
          </XStack>
          <YStack space="$2">
            <Label fontSize="$3" fontWeight="500" color="$color">Notes</Label>
            <TextArea 
              size="$4"
              value={lotNotes}
              onChangeText={setLotNotes}
              numberOfLines={2}
              placeholder="Optional notes..."
              borderColor="$borderColor"
              focusStyle={{ borderColor: "$blue" }}
            />
          </YStack>
          <Button 
            size="$5"
            backgroundColor="$green"
            color="white"
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={handleAddLot}
          >
            Create Lot
          </Button>
        </YStack>
      </Card>
      
      {/* Step 2: Add Unit */}
      <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
        <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
          Step 2: Add Units to Lot
        </H3>
        
        {/* NDC Scan Section */}
        <Card padding="$4" backgroundColor="#eff6ff" borderRadius="$4" borderWidth={1} borderColor="#bfdbfe" space="$3">
          <Label fontSize="$3" fontWeight="500" color="$color">Scan Manufacturer NDC</Label>
          <Text fontSize="$2" color="$gray">
            Scan the barcode on the bottle to auto-fill drug info.
          </Text>
          <XStack space="$2" $xs={{ flexDirection: "column" }}>
            <Input 
              flex={1}
              size="$4"
              value={ndcScanInput}
              onChangeText={setNdcScanInput}
              placeholder="Enter NDC (e.g., 0071-0570-23)"
              borderColor="$borderColor"
              focusStyle={{ borderColor: "$blue" }}
              $xs={{ width: "100%" }}
            />
            <Button 
              size="$4"
              backgroundColor="$green"
              color="white"
              icon={<Camera size={20} />}
              onPress={() => setShowScanner(true)}
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              $xs={{ width: "100%" }}
            >
              Camera
            </Button>
            <Button 
              size="$4"
              backgroundColor="$blue"
              color="white"
              onPress={handleNdcLookup}
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              $xs={{ width: "100%" }}
            >
              Lookup
            </Button>
          </XStack>
          <Text fontSize="$3" color="$color">{ndcLookupStatus}</Text>
          
          {showFallback && (
            <YStack space="$3" marginTop="$4" paddingTop="$4" borderTopWidth={1} borderTopColor="#bfdbfe">
              <Label fontSize="$3" fontWeight="500" color="$color">
                Or, search by generic/brand name (Local DB + FDA):
              </Label>
              <YStack position="relative">
                <Input
                  size="$4"
                  value={nameSearch}
                  onChangeText={handleNameSearch}
                  placeholder="Type to search... (e.g., ibuprofen)"
                  borderColor="$borderColor"
                  focusStyle={{ borderColor: "$blue" }}
                />

                {/* Dropdown Results */}
                {nameSearch.length > 0 && searchResults.length > 0 && (
                  <YStack
                    position="absolute"
                    top="$10"
                    left={0}
                    right={0}
                    backgroundColor="$background"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$2"
                    shadowColor="$shadowColor"
                    shadowRadius={8}
                    shadowOpacity={0.2}
                    maxHeight={400}
                    overflow="scroll"
                    zIndex={1000}
                  >
                    {searchResults.map((drug, idx) => (
                      <Button
                        key={idx}
                        unstyled
                        padding="$3"
                        borderBottomWidth={idx < searchResults.length - 1 ? 1 : 0}
                        borderBottomColor="$borderColor"
                        hoverStyle={{ backgroundColor: "$backgroundHover" }}
                        pressStyle={{ backgroundColor: "$backgroundPress" }}
                        onPress={() => {
                          handleChipClick(drug);
                          setNameSearch('');
                        }}
                        alignItems="flex-start"
                        justifyContent="flex-start"
                      >
                        <YStack space="$1" width="100%">
                          <XStack space="$2" alignItems="center">
                            {drug.source === 'rxnorm' ? (
                              <Text fontSize="$2" color="$green10" fontWeight="600">🏥 RxNorm</Text>
                            ) : (
                              <Text fontSize="$2" color="$blue10" fontWeight="600">📦 Local</Text>
                            )}
                            <Text fontSize="$4" fontWeight="600" color="$color" flex={1}>
                              {drug.med_generic}
                            </Text>
                          </XStack>
                          <Text fontSize="$3" color="$gray">
                            {drug.med_brand} • {drug.strength} • {drug.form}
                          </Text>
                          {drug.ndc && drug.ndc !== 'N/A' && (
                            <Text fontSize="$2" color="$gray" fontFamily="$mono">
                              NDC: {drug.ndc}
                            </Text>
                          )}
                        </YStack>
                      </Button>
                    ))}
                  </YStack>
                )}

                {/* No results message */}
                {nameSearch.length >= 3 && searchResults.length === 0 && (
                  <YStack
                    position="absolute"
                    top="$10"
                    left={0}
                    right={0}
                    backgroundColor="$background"
                    borderWidth={1}
                    borderColor="$borderColor"
                    borderRadius="$2"
                    padding="$4"
                    shadowColor="$shadowColor"
                    shadowRadius={8}
                    shadowOpacity={0.2}
                    zIndex={1000}
                  >
                    <Text fontSize="$3" color="$gray" textAlign="center">
                      No matches found. Try searching by NDC or enter manually.
                    </Text>
                  </YStack>
                )}
              </YStack>

              <Button
                unstyled
                onPress={handleEnterManually}
                fontSize="$3"
                color="$color"
                textDecorationLine="underline"
                padding="$0"
                marginTop="$2"
                hoverStyle={{ opacity: 0.7 }}
                pressStyle={{ opacity: 0.5 }}
              >
                Enter Manually Instead
              </Button>
            </YStack>
          )}
        </Card>
        
        <YStack space="$4" tag="form" onSubmit={(e: any) => { e.preventDefault(); handleAddUnit(e); }}>
          <YStack space="$2">
            <Label fontSize="$3" fontWeight="500" color="$color">Selected Lot *</Label>
            <Select 
              value={selectedLotId}
              onValueChange={setSelectedLotId}
            >
              <Select.Trigger width="100%" iconAfter={<ChevronDown size={16} />}>
                <Select.Value placeholder="-- Select a Lot --" />
              </Select.Trigger>
              <Adapt platform="touch">
                <Sheet modal dismissOnSnapToBottom>
                  <Sheet.Frame>
                    <Sheet.ScrollView>
                      <Adapt.Contents />
                    </Sheet.ScrollView>
                  </Sheet.Frame>
                  <Sheet.Overlay />
                </Sheet>
              </Adapt>
              <Select.Content zIndex={200000}>
                <Select.ScrollUpButton />
                <Select.Viewport>
                  {lots.map((lot, index) => (
                    <Select.Item key={lot.id} index={index} value={lot.id}>
                      <Select.ItemText>
                        Lot {lot.id.substring(0, 6)}... (Source: {lot.source_donor}, Date: {lot.date_received})
                      </Select.ItemText>
                      <Select.ItemIndicator>
                        <Check size={16} />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>
          
          <XStack flexWrap="wrap" gap="$4" $xs={{ flexDirection: "column" }} $sm={{ flexDirection: "column" }}>
            <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Generic Name</Label>
              <Input 
                size="$4"
                value={genericName}
                onChangeText={setGenericName}
                readOnly={fieldsLocked}
                placeholder="e.g., Amoxicillin"
                backgroundColor={fieldsLocked ? "$backgroundHover" : "$background"}
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
                required
              />
            </YStack>
            <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Strength</Label>
              <Input 
                size="$4"
                value={strength}
                onChangeText={setStrength}
                readOnly={fieldsLocked}
                placeholder="e.g., 500 mg"
                backgroundColor={fieldsLocked ? "$backgroundHover" : "$background"}
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
                required
              />
            </YStack>
            <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Form</Label>
              <Input 
                size="$4"
                value={form}
                onChangeText={setForm}
                readOnly={fieldsLocked}
                placeholder="e.g., Capsule"
                backgroundColor={fieldsLocked ? "$backgroundHover" : "$background"}
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
                required
              />
            </YStack>
          </XStack>
          
          <XStack flexWrap="wrap" gap="$4" $xs={{ flexDirection: "column" }} $sm={{ flexDirection: "column" }}>
            <YStack space="$2" flex={1} minWidth={200} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Brand Name</Label>
              <Input 
                size="$4"
                value={brandName}
                onChangeText={setBrandName}
                readOnly={fieldsLocked}
                placeholder="e.g., Amoxil"
                backgroundColor={fieldsLocked ? "$backgroundHover" : "$background"}
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
              />
            </YStack>
            <YStack space="$2" flex={1} minWidth={200} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">NDC</Label>
              <Input 
                size="$4"
                value={ndc}
                onChangeText={setNdc}
                readOnly={fieldsLocked}
                placeholder="e.g., 12345-678-90"
                backgroundColor={fieldsLocked ? "$backgroundHover" : "$background"}
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
              />
            </YStack>
          </XStack>
          
          <XStack flexWrap="wrap" gap="$4" $xs={{ flexDirection: "column" }} $sm={{ flexDirection: "column" }}>
            <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Total Quantity</Label>
              <Input 
                size="$4"
                value={qty}
                onChangeText={setQty}
                placeholder="Enter Qty"
                keyboardType="numeric"
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue" }}
                required
              />
            </YStack>
            <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Expiry Date</Label>
              <DateInput 
                size={4}
                value={expDate}
                onChange={setExpDate}
                required
              />
            </YStack>
            <YStack space="$2" flex={1} minWidth={150} $xs={{ minWidth: "100%" }} $sm={{ minWidth: "100%" }}>
              <Label fontSize="$3" fontWeight="500" color="$color">Location *</Label>
              <Select 
                value={locationId}
                onValueChange={setLocationId}
              >
                <Select.Trigger width="100%" iconAfter={<ChevronDown size={16} />}>
                  <Select.Value placeholder="-- Select a Location --" />
                </Select.Trigger>
                <Adapt platform="touch">
                  <Sheet modal dismissOnSnapToBottom>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>
                <Select.Content zIndex={200000}>
                  <Select.ScrollUpButton />
                  <Select.Viewport>
                    {locations.map((loc, index) => (
                      <Select.Item key={loc.id} index={index} value={loc.id}>
                        <Select.ItemText>
                          {loc.name} ({loc.temp_type})
                        </Select.ItemText>
                        <Select.ItemIndicator>
                          <Check size={16} />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                  <Select.ScrollDownButton />
                </Select.Content>
              </Select>
            </YStack>
          </XStack>
          
          <Button 
            size="$5"
            backgroundColor="$blue"
            color="white"
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            onPress={handleAddUnit}
          >
            Add Unit & Generate DaanaRX Label
          </Button>
        </YStack>
      </Card>
      
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title="Scan NDC Barcode"
      />
      
      <PrintLabelModal 
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        unit={createdUnit}
      />
      
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
      >
        <YStack space="$4">
          <Text paddingVertical="$4">{modalMessage}</Text>
          <XStack justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button 
              onPress={() => setShowModal(false)}
              backgroundColor="$blue"
              color="white"
              size="$4"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
            >
              OK
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
};

export default CheckIn;

