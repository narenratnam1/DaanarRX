import React, { useState } from 'react';
import { YStack, XStack, Button, Text, H2, Card, ScrollView } from 'tamagui';
import { ShoppingCart, Trash2 } from 'lucide-react';
import { ViewType } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { doc, writeBatch, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ConfirmModal from '../shared/ConfirmModal';
import Modal from '../shared/Modal';

interface InventoryProps {
  onNavigate: (view: ViewType) => void;
  onCheckOutUnit?: (unitId: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ onNavigate, onCheckOutUnit }) => {
  const { units, locations, userId } = useFirebase();
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removeUnitId, setRemoveUnitId] = useState('');
  const [removedUnit, setRemovedUnit] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const showInfoModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const handleCheckOutClick = (unitId: string) => {
    if (onCheckOutUnit) {
      onCheckOutUnit(unitId);
    }
    onNavigate('check-out');
  };

  const exportToCSV = () => {
    if (units.length === 0) {
      showInfoModal('Info', 'No data to export.');
      return;
    }
    
    const headers = ['Medication', 'Daana ID', 'Qty', 'Status', 'Location', 'Expires', 'NDC'];
    let csvContent = headers.join(',') + '\n';
    
    units.forEach(unit => {
      const locationName = locations.find(l => l.id === unit.location_id)?.name || 'N/A';
      const row = [
        `"${unit.med_generic} ${unit.strength} ${unit.form}"`,
        unit.daana_id,
        unit.qty_total,
        unit.status,
        locationName,
        unit.exp_date,
        unit.ndc || ''
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'daanarx_inventory.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemove = (unitDocId: string) => {
    setRemoveUnitId(unitDocId);
    setShowRemoveModal(true);
  };

  const confirmRemove = async () => {
    const unit = units.find(u => u.id === removeUnitId);
    if (!unit) return;
    
    try {
      const batch = writeBatch(db);
      
      // Delete the unit
      const unitRef = doc(db, 'units', removeUnitId);
      batch.delete(unitRef);
      
      // Log transaction
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        unit_id: unit.daana_id,
        type: 'remove',
        qty: unit.qty_total,
        by_user_id: userId,
        reason_note: 'Unit removed from inventory',
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      
      // Save the removed unit for the success modal
      const locationName = locations.find(l => l.id === unit.location_id)?.name || 'Unknown';
      setRemovedUnit({ ...unit, locationName });
      
      setModalTitle('Success');
      setModalMessage('');
      setShowModal(true);
      setShowRemoveModal(false);
    } catch (error: any) {
      console.error('Error removing unit:', error);
      showInfoModal('Error', `Could not remove unit: ${error.message}`);
    }
  };

  const handleQuarantine = (unitDocId: string) => {
    setSelectedUnitId(unitDocId);
    setShowConfirmModal(true);
  };

  const confirmQuarantine = async () => {
    const unit = units.find(u => u.id === selectedUnitId);
    if (!unit) return;
    
    try {
      const batch = writeBatch(db);
      
      const unitRef = doc(db, 'units', selectedUnitId);
      batch.update(unitRef, {
        status: 'quarantined',
        updated_at: serverTimestamp()
      });
      
      const txnRef = doc(collection(db, 'transactions'));
      batch.set(txnRef, {
        unit_id: unit.daana_id,
        type: 'adjust',
        by_user_id: userId,
        reason_note: 'QUARANTINE: Manual quarantine by user.',
        timestamp: serverTimestamp()
      });
      
      await batch.commit();
      showInfoModal('Success', `Unit ${unit.daana_id} has been quarantined.`);
    } catch (error: any) {
      console.error('Error quarantining unit:', error);
      showInfoModal('Error', `Could not quarantine unit: ${error.message}`);
    }
  };

  const handleSort = (column: 'name' | 'date') => {
    if (sortBy === column) {
      // Toggle sort order
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Change sort column
      setSortBy(column);
      setSortOrder(column === 'date' ? 'desc' : 'asc'); // Default: newest first for date, A-Z for name
    }
  };

  // Sort units based on selected criteria
  const sortedUnits = [...units].sort((a, b) => {
    if (sortBy === 'date') {
      const aTime = a.created_at?.toMillis() || 0;
      const bTime = b.created_at?.toMillis() || 0;
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    } else {
      // Sort by name
      const comparison = a.med_generic.localeCompare(b.med_generic);
      return sortOrder === 'asc' ? comparison : -comparison;
    }
  });

  return (
    <YStack flex={1} space="$4" paddingVertical="$4">
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2" $xs={{ flexDirection: "column" }}>
        <Button 
          onPress={() => onNavigate('home')}
          backgroundColor="$gray"
          color="white"
          size="$4"
          hoverStyle={{ backgroundColor: "#4b5563" }}
          pressStyle={{ backgroundColor: "#374151" }}
          icon={<Text>←</Text>}
          $xs={{ width: "100%", order: 1 }}
        >
          Back to Home
        </Button>
        <H2 fontSize="$9" fontWeight="600" color="$color" $xs={{ fontSize: "$8", order: 2, width: "100%", textAlign: "center" }}>
          Full Inventory
        </H2>
        <Button 
          onPress={exportToCSV}
          backgroundColor="$gray"
          color="white"
          size="$4"
          hoverStyle={{ backgroundColor: "#4b5563" }}
          pressStyle={{ backgroundColor: "#374151" }}
          $xs={{ width: "100%", order: 3 }}
        >
          Export CSV
        </Button>
      </XStack>
      
      <Card elevate backgroundColor="$background" borderRadius="$4" overflow="hidden">
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <YStack width="100%" minWidth={1000}>
            {/* Table Header */}
            <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor" alignItems="center">
              <Button
                unstyled
                flex={3}
                minWidth={200}
                justifyContent="flex-start"
                alignItems="flex-start"
                onPress={() => handleSort('name')}
                paddingRight="$3"
                hoverStyle={{ opacity: 0.7 }}
                $xs={{ minWidth: 150 }}
                $sm={{ minWidth: 180 }}
                $md={{ minWidth: 200 }}
              >
                <Text fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="left">
                  Medication {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </Button>
              <Text flex={2} minWidth={150} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 120 }}>Daana ID</Text>
              <Text flex={0.5} minWidth={60} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 50 }}>Qty</Text>
              <Text flex={1} minWidth={100} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 80 }}>Status</Text>
              <Text flex={1.5} minWidth={120} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 100 }}>Location</Text>
              <Text flex={1} minWidth={100} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 90 }}>Expires</Text>
              <Button
                unstyled
                flex={1.5}
                minWidth={120}
                justifyContent="flex-start"
                alignItems="flex-start"
                onPress={() => handleSort('date')}
                paddingRight="$3"
                hoverStyle={{ opacity: 0.7 }}
                $xs={{ minWidth: 100 }}
              >
                <Text fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="left">
                  Date Added {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </Text>
              </Button>
              <Text flex={1.2} minWidth={120} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" paddingRight="$3" textAlign="left" $xs={{ minWidth: 100 }}>Actions</Text>
              <Text flex={1} minWidth={110} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="left" $xs={{ minWidth: 100 }}>Quarantine</Text>
            </XStack>
            
            {/* Table Body */}
            {sortedUnits.length === 0 ? (
              <YStack padding="$6" alignItems="center">
                <Text color="$gray" textAlign="center">
                  No units in stock.
                </Text>
              </YStack>
            ) : (
              sortedUnits.map(unit => {
                const locationName = locations.find(l => l.id === unit.location_id)?.name || 'N/A';
                const isQuarantined = unit.status === 'quarantined';
                
                return (
                  <XStack 
                    key={unit.id}
                    padding="$3"
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    backgroundColor={isQuarantined ? "#fef2f2" : "$background"}
                    hoverStyle={{ backgroundColor: isQuarantined ? "#fee2e2" : "$backgroundHover" }}
                    alignItems="center"
                  >
                    <Text 
                      flex={3} 
                      minWidth={200} 
                      fontSize="$3" 
                      fontWeight="500" 
                      color="$color" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 150, fontSize: "$2" }}
                      $sm={{ minWidth: 180 }}
                      $md={{ minWidth: 200 }}
                    >
                      {unit.med_generic} {unit.strength} {unit.form}
                    </Text>
                    <Text 
                      flex={2} 
                      minWidth={150} 
                      fontSize="$2" 
                      color="$gray" 
                      fontFamily="$mono" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 120, fontSize: "$1" }}
                    >
                      {unit.daana_id}
                    </Text>
                    <Text 
                      flex={0.5} 
                      minWidth={60} 
                      fontSize="$3" 
                      color="$gray" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 50 }}
                    >
                      {unit.qty_total}
                    </Text>
                    <Text 
                      flex={1} 
                      minWidth={100} 
                      fontSize="$3" 
                      fontWeight="500" 
                      color={isQuarantined ? "$red" : "$gray"} 
                      textTransform="capitalize" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 80, fontSize: "$2" }}
                    >
                      {unit.status.replace('_', ' ')}
                    </Text>
                    <Text 
                      flex={1.5} 
                      minWidth={120} 
                      fontSize="$3" 
                      color="$gray" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 100, fontSize: "$2" }}
                    >
                      {locationName}
                    </Text>
                    <Text 
                      flex={1} 
                      minWidth={100} 
                      fontSize="$3" 
                      color="$gray" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 90, fontSize: "$2" }}
                    >
                      {unit.exp_date}
                    </Text>
                    
                    {/* Date Added Column */}
                    <Text 
                      flex={1.5} 
                      minWidth={120} 
                      fontSize="$3" 
                      color="$gray" 
                      paddingRight="$3"
                      textAlign="left"
                      $xs={{ minWidth: 100, fontSize: "$2" }}
                    >
                      {unit.created_at?.toDate().toLocaleDateString() || 'N/A'}
                    </Text>
                    
                    {/* Actions Column with Icon Buttons */}
                    <XStack 
                      flex={1.2} 
                      minWidth={120} 
                      columnGap="$3" 
                      alignItems="center" 
                      paddingRight="$3"
                      justifyContent="flex-start"
                      $xs={{ minWidth: 100, columnGap: "$2" }}
                    >
                      {isQuarantined ? (
                        <Text fontSize="$2" color="$gray">—</Text>
                      ) : (
                        <>
                          <Button
                            size="$3"
                            circular
                            icon={<ShoppingCart size={16} />}
                            onPress={() => handleCheckOutClick(unit.daana_id)}
                            backgroundColor="$blue9"
                            color="white"
                            disabled={!['in_stock', 'partial'].includes(unit.status)}
                            hoverStyle={{ backgroundColor: "$blue10" }}
                            pressStyle={{ backgroundColor: "$blue11", scale: 0.95 }}
                            opacity={!['in_stock', 'partial'].includes(unit.status) ? 0.5 : 1}
                            aria-label="Checkout unit"
                            accessibilityLabel="Checkout unit"
                            $xs={{ size: "$2" }}
                          />
                          <Button
                            size="$3"
                            circular
                            icon={<Trash2 size={16} />}
                            onPress={() => handleRemove(unit.id)}
                            backgroundColor="$red9"
                            color="white"
                            hoverStyle={{ backgroundColor: "$red10" }}
                            pressStyle={{ backgroundColor: "$red11", scale: 0.95 }}
                            aria-label="Remove unit"
                            accessibilityLabel="Remove unit"
                            $xs={{ size: "$2" }}
                          />
                        </>
                      )}
                    </XStack>
                    
                    {/* Quarantine Column */}
                    <XStack 
                      flex={1} 
                      minWidth={110} 
                      alignItems="center"
                      justifyContent="flex-start"
                      $xs={{ minWidth: 100 }}
                    >
                      {isQuarantined ? (
                        <Text fontSize="$3" color="$red" fontWeight="500" textAlign="left">Quarantined</Text>
                      ) : (
                        <Button
                          size="$3"
                          circular
                          onPress={() => handleQuarantine(unit.id)}
                          backgroundColor="$orange9"
                          color="white"
                          hoverStyle={{ backgroundColor: "$orange10" }}
                          pressStyle={{ backgroundColor: "$orange11", scale: 0.95 }}
                          aria-label="Quarantine unit"
                          accessibilityLabel="Quarantine unit"
                          $xs={{ size: "$2" }}
                        >
                          <Text fontSize="$2" fontWeight="600" color="white" $xs={{ fontSize: "$1" }}>Q</Text>
                        </Button>
                      )}
                    </XStack>
                  </XStack>
                );
              })
            )}
          </YStack>
        </ScrollView>
      </Card>
      
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmQuarantine}
        title="Quarantine Unit?"
        message="Are you sure you want to quarantine this unit?"
      />
      
      {/* Remove Confirmation Modal with Unit Details */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={confirmRemove}
        title="Remove Unit?"
        confirmText="Remove"
        confirmColor="red"
      >
        {(() => {
          const unit = units.find(u => u.id === removeUnitId);
          if (!unit) return <Text>Unit not found</Text>;
          
          const locationName = locations.find(l => l.id === unit.location_id)?.name || 'Unknown';
          
          return (
            <YStack space="$3">
              <Text fontSize="$4" color="$gray11">
                Are you sure you want to permanently remove this unit from inventory? This action cannot be undone.
              </Text>
              
              <Card padding="$4" backgroundColor="$red2" borderWidth={2} borderColor="$red8" borderRadius="$4">
                <YStack space="$3">
                  {/* Medication Name */}
                  <YStack>
                    <Text fontSize="$2" color="$gray10" textTransform="uppercase" fontWeight="500">Medication</Text>
                    <Text fontSize="$5" fontWeight="600" color="$color">
                      {unit.med_generic} {unit.strength}
                    </Text>
                    <Text fontSize="$3" color="$gray11">{unit.form}</Text>
                  </YStack>
                  
                  {/* Details Grid */}
                  <XStack flexWrap="wrap" gap="$3" marginTop="$2">
                    {/* Daana ID */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Daana ID</Text>
                      <Text fontSize="$3" fontFamily="$mono" color="$color">{unit.daana_id}</Text>
                    </YStack>
                    
                    {/* Quantity */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Quantity</Text>
                      <Text fontSize="$3" fontWeight="600" color="$color">{unit.qty_total} units</Text>
                    </YStack>
                    
                    {/* Location */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Location</Text>
                      <Text fontSize="$3" color="$color">{locationName}</Text>
                    </YStack>
                    
                    {/* Expiration */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Expires</Text>
                      <Text fontSize="$3" color="$color">{unit.exp_date}</Text>
                    </YStack>
                    
                    {/* NDC if available */}
                    {unit.ndc && (
                      <YStack minWidth="45%">
                        <Text fontSize="$1" color="$gray10" textTransform="uppercase">NDC</Text>
                        <Text fontSize="$3" fontFamily="$mono" color="$color">{unit.ndc}</Text>
                      </YStack>
                    )}
                  </XStack>
                </YStack>
              </Card>
            </YStack>
          );
        })()}
      </ConfirmModal>
      
      {/* Success Modal with Unit Details */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setRemovedUnit(null);
        }}
        title={modalTitle}
      >
        <YStack space="$4">
          {removedUnit ? (
            <YStack space="$3">
              <Text fontSize="$5" fontWeight="600" color="$green10">
                ✓ Unit successfully removed from inventory
              </Text>
              
              <Card padding="$4" backgroundColor="$green2" borderWidth={2} borderColor="$green8" borderRadius="$4">
                <YStack space="$3">
                  {/* Medication Name */}
                  <YStack>
                    <Text fontSize="$2" color="$gray10" textTransform="uppercase" fontWeight="500">Medication</Text>
                    <Text fontSize="$5" fontWeight="600" color="$color">
                      {removedUnit.med_generic} {removedUnit.strength}
                    </Text>
                    <Text fontSize="$3" color="$gray11">{removedUnit.form}</Text>
                  </YStack>
                  
                  {/* Details Grid */}
                  <XStack flexWrap="wrap" gap="$3" marginTop="$2">
                    {/* Daana ID */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Daana ID</Text>
                      <Text fontSize="$3" fontFamily="$mono" color="$color">{removedUnit.unit_id}</Text>
                    </YStack>
                    
                    {/* Quantity */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Quantity Removed</Text>
                      <Text fontSize="$3" fontWeight="600" color="$color">{removedUnit.qty_total} units</Text>
                    </YStack>
                    
                    {/* Location */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Location</Text>
                      <Text fontSize="$3" color="$color">{removedUnit.locationName}</Text>
                    </YStack>
                    
                    {/* Expiration */}
                    <YStack minWidth="45%">
                      <Text fontSize="$1" color="$gray10" textTransform="uppercase">Expiration Date</Text>
                      <Text fontSize="$3" color="$color">{removedUnit.exp_date}</Text>
                    </YStack>
                    
                    {/* NDC if available */}
                    {removedUnit.ndc && (
                      <YStack minWidth="45%">
                        <Text fontSize="$1" color="$gray10" textTransform="uppercase">NDC</Text>
                        <Text fontSize="$3" fontFamily="$mono" color="$color">{removedUnit.ndc}</Text>
                      </YStack>
                    )}
                  </XStack>
                </YStack>
              </Card>
              
              <Text fontSize="$3" color="$gray11" textAlign="center" paddingTop="$2">
                This action has been logged in the transaction history.
              </Text>
            </YStack>
          ) : (
            <Text paddingVertical="$4">{modalMessage}</Text>
          )}
          
          <XStack justifyContent="flex-end" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button 
              onPress={() => {
                setShowModal(false);
                setRemovedUnit(null);
              }}
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

export default Inventory;

