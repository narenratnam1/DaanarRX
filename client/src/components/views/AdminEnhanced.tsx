import React, { useState } from 'react';
import { YStack, XStack, Button, Input, Text, H2, H3, Card, Select, ScrollView, Tabs } from 'tamagui';
import { Check, ChevronDown, Edit2, Trash2, Download, Settings, Package, MapPin, Archive } from 'lucide-react';
import { ViewType, Location, Lot, Unit } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';

interface AdminEnhancedProps {
  onNavigate: (view: ViewType) => void;
}

const AdminEnhanced: React.FC<AdminEnhancedProps> = ({ onNavigate }) => {
  const { locations, units, lots, transactions } = useFirebase();
  
  // General modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  // Location management state
  const [locationName, setLocationName] = useState('');
  const [locationTemp, setLocationTemp] = useState<'room' | 'fridge'>('room');
  const [locationCapacity, setLocationCapacity] = useState('');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [editLocationTemp, setEditLocationTemp] = useState<'room' | 'fridge'>('room');
  const [editLocationCapacity, setEditLocationCapacity] = useState('');
  const [showEditLocationModal, setShowEditLocationModal] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [showDeleteLocationConfirm, setShowDeleteLocationConfirm] = useState(false);
  
  // Lot management state
  const [editingLot, setEditingLot] = useState<Lot | null>(null);
  const [editLotSource, setEditLotSource] = useState('');
  const [editLotNotes, setEditLotNotes] = useState('');
  const [editLotDate, setEditLotDate] = useState('');
  const [showEditLotModal, setShowEditLotModal] = useState(false);
  const [deletingLot, setDeletingLot] = useState<Lot | null>(null);
  const [showDeleteLotConfirm, setShowDeleteLotConfirm] = useState(false);
  const [viewingLot, setViewingLot] = useState<Lot | null>(null);
  const [showViewLotModal, setShowViewLotModal] = useState(false);
  
  // Unit management state
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitLocationId, setEditUnitLocationId] = useState('');
  const [editUnitStatus, setEditUnitStatus] = useState<Unit['status']>('in_stock');
  const [editUnitQty, setEditUnitQty] = useState('');
  const [showEditUnitModal, setShowEditUnitModal] = useState(false);
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
  const [showDeleteUnitConfirm, setShowDeleteUnitConfirm] = useState(false);
  
  // Batch operations state
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [batchTargetLocation, setBatchTargetLocation] = useState('');
  const [batchTargetStatus, setBatchTargetStatus] = useState<Unit['status']>('in_stock');
  const [showBatchModal, setShowBatchModal] = useState(false);
  
  // Active tab
  const [activeTab, setActiveTab] = useState('locations');

  const showInfoModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  // ==================== LOCATION MANAGEMENT ====================
  
  const handleAddLocation = async () => {
    if (!locationName.trim()) {
      showInfoModal('Error', 'Please enter a location name.');
      return;
    }
    
    try {
      const locData: any = {
        name: locationName,
        temp_type: locationTemp,
        is_active: true,
        created_at: Timestamp.now()
      };
      
      if (locationCapacity && parseInt(locationCapacity) > 0) {
        locData.capacity = parseInt(locationCapacity);
      }
      
      await addDoc(collection(db, 'locations'), locData);
      showInfoModal('Success', `Location "${locationName}" added.`);
      setLocationName('');
      setLocationTemp('room');
      setLocationCapacity('');
    } catch (error: any) {
      console.error('Error adding location:', error);
      showInfoModal('Error', `Could not add location: ${error.message}`);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setEditLocationName(location.name);
    setEditLocationTemp(location.temp_type);
    setEditLocationCapacity((location as any).capacity?.toString() || '');
    setShowEditLocationModal(true);
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation || !editLocationName.trim()) return;

    try {
      const locationRef = doc(db, 'locations', editingLocation.id);
      const updateData: any = {
        name: editLocationName,
        temp_type: editLocationTemp
      };
      
      if (editLocationCapacity && parseInt(editLocationCapacity) > 0) {
        updateData.capacity = parseInt(editLocationCapacity);
      }
      
      await updateDoc(locationRef, updateData);
      
      showInfoModal('Success', `Location "${editLocationName}" updated.`);
      setShowEditLocationModal(false);
      setEditingLocation(null);
      setEditLocationName('');
      setEditLocationTemp('room');
      setEditLocationCapacity('');
    } catch (error: any) {
      console.error('Error updating location:', error);
      showInfoModal('Error', `Could not update location: ${error.message}`);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;

    try {
      const unitsUsingLocation = units.filter(unit => unit.location_id === deletingLocation.id);
      
      if (unitsUsingLocation.length > 0) {
        showInfoModal(
          'Cannot Delete Location', 
          `This location is in use by ${unitsUsingLocation.length} unit(s). Please move or remove these units first.`
        );
        setShowDeleteLocationConfirm(false);
        setDeletingLocation(null);
        return;
      }

      const locationRef = doc(db, 'locations', deletingLocation.id);
      await deleteDoc(locationRef);
      
      showInfoModal('Success', `Location "${deletingLocation.name}" deleted.`);
      setShowDeleteLocationConfirm(false);
      setDeletingLocation(null);
    } catch (error: any) {
      console.error('Error deleting location:', error);
      showInfoModal('Error', `Could not delete location: ${error.message}`);
      setShowDeleteLocationConfirm(false);
      setDeletingLocation(null);
    }
  };

  // ==================== LOT MANAGEMENT ====================

  const handleEditLot = (lot: Lot) => {
    setEditingLot(lot);
    setEditLotSource(lot.source_donor);
    setEditLotNotes(lot.notes);
    setEditLotDate(lot.date_received);
    setShowEditLotModal(true);
  };

  const handleUpdateLot = async () => {
    if (!editingLot) return;

    try {
      const lotRef = doc(db, 'lots', editingLot.id);
      await updateDoc(lotRef, {
        source_donor: editLotSource,
        notes: editLotNotes,
        date_received: editLotDate
      });
      
      showInfoModal('Success', 'Lot updated successfully.');
      setShowEditLotModal(false);
      setEditingLot(null);
    } catch (error: any) {
      console.error('Error updating lot:', error);
      showInfoModal('Error', `Could not update lot: ${error.message}`);
    }
  };

  const handleDeleteLot = async () => {
    if (!deletingLot) return;

    try {
      const unitsInLot = units.filter(unit => unit.lot_id === deletingLot.id);
      
      if (unitsInLot.length > 0) {
        showInfoModal(
          'Cannot Delete Lot', 
          `This lot has ${unitsInLot.length} associated unit(s). Please delete the units first.`
        );
        setShowDeleteLotConfirm(false);
        setDeletingLot(null);
        return;
      }

      const lotRef = doc(db, 'lots', deletingLot.id);
      await deleteDoc(lotRef);
      
      showInfoModal('Success', 'Lot deleted successfully.');
      setShowDeleteLotConfirm(false);
      setDeletingLot(null);
    } catch (error: any) {
      console.error('Error deleting lot:', error);
      showInfoModal('Error', `Could not delete lot: ${error.message}`);
      setShowDeleteLotConfirm(false);
      setDeletingLot(null);
    }
  };

  const handleViewLot = (lot: Lot) => {
    setViewingLot(lot);
    setShowViewLotModal(true);
  };

  // ==================== UNIT MANAGEMENT ====================

  const handleEditUnit = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnitLocationId(unit.location_id);
    setEditUnitStatus(unit.status);
    setEditUnitQty(unit.qty_total.toString());
    setShowEditUnitModal(true);
  };

  const handleUpdateUnit = async () => {
    if (!editingUnit) return;

    try {
      const unitRef = doc(db, 'units', editingUnit.id);
      const locationName = locations.find(l => l.id === editUnitLocationId)?.name || '';
      
      await updateDoc(unitRef, {
        location_id: editUnitLocationId,
        location_name: locationName,
        status: editUnitStatus,
        qty_total: parseInt(editUnitQty),
        updated_at: Timestamp.now()
      });
      
      // Add transaction for move/status change
      await addDoc(collection(db, 'transactions'), {
        daana_id: editingUnit.daana_id,
        type: 'adjust',
        reason_note: `Admin update: Status=${editUnitStatus}, Qty=${editUnitQty}, Location=${locationName}`,
        by_user_id: 'admin',
        timestamp: Timestamp.now()
      });
      
      showInfoModal('Success', 'Unit updated successfully.');
      setShowEditUnitModal(false);
      setEditingUnit(null);
    } catch (error: any) {
      console.error('Error updating unit:', error);
      showInfoModal('Error', `Could not update unit: ${error.message}`);
    }
  };

  const handleDeleteUnit = async () => {
    if (!deletingUnit) return;

    try {
      // Add transaction record before deleting
      await addDoc(collection(db, 'transactions'), {
        daana_id: deletingUnit.daana_id,
        type: 'adjust',
        reason_note: 'Unit deleted by admin',
        by_user_id: 'admin',
        timestamp: Timestamp.now()
      });

      const unitRef = doc(db, 'units', deletingUnit.id);
      await deleteDoc(unitRef);
      
      showInfoModal('Success', 'Unit deleted successfully.');
      setShowDeleteUnitConfirm(false);
      setDeletingUnit(null);
    } catch (error: any) {
      console.error('Error deleting unit:', error);
      showInfoModal('Error', `Could not delete unit: ${error.message}`);
      setShowDeleteUnitConfirm(false);
      setDeletingUnit(null);
    }
  };

  // ==================== BATCH OPERATIONS ====================

  const toggleUnitSelection = (unitId: string) => {
    const newSelection = new Set(selectedUnits);
    if (newSelection.has(unitId)) {
      newSelection.delete(unitId);
    } else {
      newSelection.add(unitId);
    }
    setSelectedUnits(newSelection);
  };

  const handleBatchMove = async () => {
    if (selectedUnits.size === 0 || !batchTargetLocation) {
      showInfoModal('Error', 'Please select units and a target location.');
      return;
    }

    try {
      const batch = writeBatch(db);
      const locationName = locations.find(l => l.id === batchTargetLocation)?.name || '';
      
      selectedUnits.forEach(unitId => {
        const unitRef = doc(db, 'units', unitId);
        batch.update(unitRef, {
          location_id: batchTargetLocation,
          location_name: locationName,
          updated_at: Timestamp.now()
        });
      });
      
      await batch.commit();
      
      // Add transactions
      const promises = Array.from(selectedUnits).map(unitId => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
          return addDoc(collection(db, 'transactions'), {
            daana_id: unit.daana_id,
            type: 'move',
            reason_note: `Batch moved to ${locationName}`,
            by_user_id: 'admin',
            timestamp: Timestamp.now()
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      
      showInfoModal('Success', `${selectedUnits.size} unit(s) moved successfully.`);
      setSelectedUnits(new Set());
      setShowBatchModal(false);
    } catch (error: any) {
      console.error('Error batch moving units:', error);
      showInfoModal('Error', `Could not move units: ${error.message}`);
    }
  };

  const handleBatchStatusChange = async () => {
    if (selectedUnits.size === 0) {
      showInfoModal('Error', 'Please select units.');
      return;
    }

    try {
      const batch = writeBatch(db);
      
      selectedUnits.forEach(unitId => {
        const unitRef = doc(db, 'units', unitId);
        batch.update(unitRef, {
          status: batchTargetStatus,
          updated_at: Timestamp.now()
        });
      });
      
      await batch.commit();
      
      // Add transactions
      const promises = Array.from(selectedUnits).map(unitId => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
          return addDoc(collection(db, 'transactions'), {
            daana_id: unit.daana_id,
            type: 'adjust',
            reason_note: `Batch status changed to ${batchTargetStatus}`,
            by_user_id: 'admin',
            timestamp: Timestamp.now()
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      
      showInfoModal('Success', `${selectedUnits.size} unit(s) status updated.`);
      setSelectedUnits(new Set());
      setShowBatchModal(false);
    } catch (error: any) {
      console.error('Error batch updating units:', error);
      showInfoModal('Error', `Could not update units: ${error.message}`);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUnits.size === 0) {
      showInfoModal('Error', 'Please select units.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedUnits.size} unit(s)? This cannot be undone.`)) {
      return;
    }

    try {
      const batch = writeBatch(db);
      
      // Add transactions first
      const promises = Array.from(selectedUnits).map(unitId => {
        const unit = units.find(u => u.id === unitId);
        if (unit) {
          return addDoc(collection(db, 'transactions'), {
            daana_id: unit.daana_id,
            type: 'adjust',
            reason_note: 'Batch deleted by admin',
            by_user_id: 'admin',
            timestamp: Timestamp.now()
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
      
      // Delete units
      selectedUnits.forEach(unitId => {
        const unitRef = doc(db, 'units', unitId);
        batch.delete(unitRef);
      });
      
      await batch.commit();
      
      showInfoModal('Success', `${selectedUnits.size} unit(s) deleted.`);
      setSelectedUnits(new Set());
      setShowBatchModal(false);
    } catch (error: any) {
      console.error('Error batch deleting units:', error);
      showInfoModal('Error', `Could not delete units: ${error.message}`);
    }
  };

  // ==================== DATA EXPORT ====================

  const handleExportData = () => {
    try {
      const exportData = {
        locations,
        lots,
        units,
        transactions,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `daanaRX-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showInfoModal('Success', 'Database exported successfully!');
    } catch (error: any) {
      console.error('Error exporting data:', error);
      showInfoModal('Error', `Could not export data: ${error.message}`);
    }
  };

  // Get lot units
  const getLotUnits = (lotId: string) => units.filter(u => u.lot_id === lotId);

  return (
    <YStack flex={1} space="$6" paddingVertical="$4">
      <XStack space="$3" alignItems="center" $xs={{ flexDirection: "column" }}>
        <Button 
          onPress={() => onNavigate('home')}
          backgroundColor="$gray"
          color="white"
          size="$4"
          hoverStyle={{ backgroundColor: "#4b5563" }}
          pressStyle={{ backgroundColor: "#374151" }}
          icon={<Text>←</Text>}
          $xs={{ width: "100%" }}
        >
          Back to Home
        </Button>
        
        <H2 flex={1} fontSize="$9" fontWeight="600" color="$color" $xs={{ fontSize: "$8" }}>
          Admin Dashboard
        </H2>
      </XStack>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        flexDirection="column"
        width="100%"
      >
        <Tabs.List
          separator={<Text paddingHorizontal="$2" opacity={0.3}>|</Text>}
          disablePassBorderRadius="bottom"
        >
          <Tabs.Tab flex={1} value="locations">
            <MapPin size={16} />
            <Text marginLeft="$2">Locations</Text>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="lots">
            <Archive size={16} />
            <Text marginLeft="$2">Lots</Text>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="units">
            <Package size={16} />
            <Text marginLeft="$2">Units</Text>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="batch">
            <Settings size={16} />
            <Text marginLeft="$2">Batch Ops</Text>
          </Tabs.Tab>
          <Tabs.Tab flex={1} value="system">
            <Download size={16} />
            <Text marginLeft="$2">System</Text>
          </Tabs.Tab>
        </Tabs.List>

        {/* LOCATIONS TAB */}
        <Tabs.Content value="locations" padding="$4">
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
            <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
              Manage Locations
            </H3>
            
            <YStack space="$3">
              <XStack space="$2" $xs={{ flexDirection: "column" }}>
                <Input 
                  flex={2}
                  size="$4"
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="Location Name (e.g., A-1-1)"
                  $xs={{ width: "100%" }}
                />
                <Select 
                  value={locationTemp}
                  onValueChange={(value) => setLocationTemp(value as 'room' | 'fridge')}
                >
                  <Select.Trigger flex={1} iconAfter={<ChevronDown size={16} />} $xs={{ width: "100%" }}>
                    <Select.Value placeholder="Temp Type" />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      <Select.Item index={0} value="room">
                        <Select.ItemText>Room</Select.ItemText>
                        <Select.ItemIndicator><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                      <Select.Item index={1} value="fridge">
                        <Select.ItemText>Fridge</Select.ItemText>
                        <Select.ItemIndicator><Check size={16} /></Select.ItemIndicator>
                      </Select.Item>
                    </Select.Viewport>
                  </Select.Content>
                </Select>
                <Input 
                  flex={1}
                  size="$4"
                  value={locationCapacity}
                  onChangeText={setLocationCapacity}
                  placeholder="Capacity (optional)"
                  inputMode="numeric"
                  $xs={{ width: "100%" }}
                />
                <Button 
                  size="$4"
                  backgroundColor="$blue"
                  color="white"
                  onPress={handleAddLocation}
                  $xs={{ width: "100%" }}
                >
                  Add
                </Button>
              </XStack>
            </YStack>
            
            <ScrollView maxHeight={500}>
              <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden">
                <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Name</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Type</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Units</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="center">Actions</Text>
                </XStack>
                
                {locations.length === 0 ? (
                  <YStack padding="$6" alignItems="center">
                    <Text color="$gray">No locations found.</Text>
                  </YStack>
                ) : (
                  locations.map(location => {
                    const unitCount = units.filter(u => u.location_id === location.id).length;
                    const capacity = (location as any).capacity;
                    
                    return (
                      <XStack 
                        key={location.id}
                        padding="$3"
                        borderBottomWidth={1}
                        borderBottomColor="$borderColor"
                        alignItems="center"
                      >
                        <Text flex={2} fontSize="$3" fontWeight="500" color="$color">
                          {location.name}
                        </Text>
                        <Text flex={1} fontSize="$3" color="$gray" textTransform="capitalize">
                          {location.temp_type}
                        </Text>
                        <Text flex={1} fontSize="$3" color={capacity && unitCount >= capacity ? "$red" : "$color"}>
                          {unitCount}{capacity ? ` / ${capacity}` : ''}
                        </Text>
                        <XStack flex={1} justifyContent="center" space="$2">
                          <Button
                            size="$3"
                            backgroundColor="$blue"
                            color="white"
                            onPress={() => handleEditLocation(location)}
                            icon={<Edit2 size={14} />}
                            circular
                          />
                          <Button
                            size="$3"
                            backgroundColor="$red"
                            color="white"
                            onPress={() => {
                              setDeletingLocation(location);
                              setShowDeleteLocationConfirm(true);
                            }}
                            icon={<Trash2 size={14} />}
                            circular
                          />
                        </XStack>
                      </XStack>
                    );
                  })
                )}
              </YStack>
            </ScrollView>
          </Card>
        </Tabs.Content>

        {/* LOTS TAB */}
        <Tabs.Content value="lots" padding="$4">
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
            <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
              Manage Lots
            </H3>
            
            <ScrollView maxHeight={500}>
              <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden">
                <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Date Received</Text>
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Source/Donor</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Units</Text>
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="center">Actions</Text>
                </XStack>
                
                {lots.length === 0 ? (
                  <YStack padding="$6" alignItems="center">
                    <Text color="$gray">No lots found.</Text>
                  </YStack>
                ) : (
                  lots.map(lot => {
                    const lotUnits = getLotUnits(lot.id);
                    
                    return (
                      <XStack 
                        key={lot.id}
                        padding="$3"
                        borderBottomWidth={1}
                        borderBottomColor="$borderColor"
                        alignItems="center"
                      >
                        <Text flex={2} fontSize="$3" color="$color">
                          {lot.date_received}
                        </Text>
                        <Text flex={2} fontSize="$3" color="$color">
                          {lot.source_donor}
                        </Text>
                        <Text flex={1} fontSize="$3" color="$gray">
                          {lotUnits.length}
                        </Text>
                        <XStack flex={2} justifyContent="center" space="$2">
                          <Button
                            size="$3"
                            backgroundColor="$green"
                            color="white"
                            onPress={() => handleViewLot(lot)}
                          >
                            View
                          </Button>
                          <Button
                            size="$3"
                            backgroundColor="$blue"
                            color="white"
                            onPress={() => handleEditLot(lot)}
                            icon={<Edit2 size={14} />}
                          />
                          <Button
                            size="$3"
                            backgroundColor="$red"
                            color="white"
                            onPress={() => {
                              setDeletingLot(lot);
                              setShowDeleteLotConfirm(true);
                            }}
                            icon={<Trash2 size={14} />}
                          />
                        </XStack>
                      </XStack>
                    );
                  })
                )}
              </YStack>
            </ScrollView>
          </Card>
        </Tabs.Content>

        {/* UNITS TAB */}
        <Tabs.Content value="units" padding="$4">
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
            <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
              Manage Units ({units.length})
            </H3>
            
            <ScrollView maxHeight={500}>
              <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden">
                <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Daana ID</Text>
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Medication</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Location</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Status</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Qty</Text>
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="center">Actions</Text>
                </XStack>
                
                {units.length === 0 ? (
                  <YStack padding="$6" alignItems="center">
                    <Text color="$gray">No units found.</Text>
                  </YStack>
                ) : (
                  units.slice(0, 50).map(unit => (
                    <XStack 
                      key={unit.id}
                      padding="$3"
                      borderBottomWidth={1}
                      borderBottomColor="$borderColor"
                      alignItems="center"
                    >
                      <Text flex={2} fontSize="$2" fontFamily="$mono" color="$color">
                        {unit.daana_id}
                      </Text>
                      <Text flex={2} fontSize="$3" color="$color">
                        {unit.med_generic || unit.med_brand}
                      </Text>
                      <Text flex={1} fontSize="$2" color="$gray">
                        {unit.location_name}
                      </Text>
                      <Text flex={1} fontSize="$2" color="$gray" textTransform="capitalize">
                        {unit.status.replace('_', ' ')}
                      </Text>
                      <Text flex={1} fontSize="$3" color="$color">
                        {unit.qty_total}
                      </Text>
                      <XStack flex={2} justifyContent="center" space="$2">
                        <Button
                          size="$3"
                          backgroundColor="$blue"
                          color="white"
                          onPress={() => handleEditUnit(unit)}
                          icon={<Edit2 size={14} />}
                        />
                        <Button
                          size="$3"
                          backgroundColor="$red"
                          color="white"
                          onPress={() => {
                            setDeletingUnit(unit);
                            setShowDeleteUnitConfirm(true);
                          }}
                          icon={<Trash2 size={14} />}
                        />
                      </XStack>
                    </XStack>
                  ))
                )}
                {units.length > 50 && (
                  <YStack padding="$3" alignItems="center" backgroundColor="$backgroundHover">
                    <Text fontSize="$2" color="$gray">
                      Showing first 50 of {units.length} units. Use filters to narrow down.
                    </Text>
                  </YStack>
                )}
              </YStack>
            </ScrollView>
          </Card>
        </Tabs.Content>

        {/* BATCH OPERATIONS TAB */}
        <Tabs.Content value="batch" padding="$4">
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
            <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
              Batch Operations
            </H3>
            
            <Text color="$gray" fontSize="$3">
              Select units below, then choose an operation.
            </Text>
            
            <YStack space="$3">
              <XStack space="$2" alignItems="center" flexWrap="wrap">
                <Text fontSize="$3" color="$color">Status:</Text>
                <Select 
                  value={batchTargetStatus}
                  onValueChange={(value) => setBatchTargetStatus(value as Unit['status'])}
                >
                  <Select.Trigger width={150} iconAfter={<ChevronDown size={16} />}>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content zIndex={200000}>
                    <Select.Viewport>
                      {(['in_stock', 'partial', 'dispensed', 'expired', 'discarded', 'quarantined'] as Unit['status'][]).map((status, idx) => (
                        <Select.Item key={status} index={idx} value={status}>
                          <Select.ItemText>{status.replace('_', ' ')}</Select.ItemText>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select>
              </XStack>
              
              <XStack space="$2" flexWrap="wrap">
                <Button
                  size="$3"
                  backgroundColor="$blue"
                  color="white"
                  onPress={() => {
                    if (selectedUnits.size === 0) {
                      showInfoModal('Error', 'Please select units first.');
                      return;
                    }
                    setShowBatchModal(true);
                  }}
                  disabled={selectedUnits.size === 0}
                >
                  Move Selected ({selectedUnits.size})
                </Button>
                <Button
                  size="$3"
                  backgroundColor="$orange"
                  color="white"
                  onPress={handleBatchStatusChange}
                  disabled={selectedUnits.size === 0}
                >
                  Change Status ({selectedUnits.size})
                </Button>
                <Button
                  size="$3"
                  backgroundColor="$red"
                  color="white"
                  onPress={handleBatchDelete}
                  disabled={selectedUnits.size === 0}
                >
                  Delete Selected ({selectedUnits.size})
                </Button>
                <Button
                  size="$3"
                  backgroundColor="$gray"
                  color="white"
                  onPress={() => setSelectedUnits(new Set())}
                  disabled={selectedUnits.size === 0}
                >
                  Clear Selection
                </Button>
              </XStack>
            </YStack>
            
            <ScrollView maxHeight={400}>
              <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden">
                <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                  <Text width={40} fontSize="$2" fontWeight="500" color="$gray">☑</Text>
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Daana ID</Text>
                  <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Medication</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Location</Text>
                  <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Status</Text>
                </XStack>
                
                {units.map(unit => (
                  <XStack 
                    key={unit.id}
                    padding="$3"
                    borderBottomWidth={1}
                    borderBottomColor="$borderColor"
                    alignItems="center"
                    onPress={() => toggleUnitSelection(unit.id)}
                    cursor="pointer"
                    hoverStyle={{ backgroundColor: "$backgroundHover" }}
                  >
                    <XStack width={40} justifyContent="center">
                      <Text fontSize="$6" color={selectedUnits.has(unit.id) ? "$blue" : "$gray"}>
                        {selectedUnits.has(unit.id) ? '☑' : '☐'}
                      </Text>
                    </XStack>
                    <Text flex={2} fontSize="$2" fontFamily="$mono" color="$color">
                      {unit.daana_id}
                    </Text>
                    <Text flex={2} fontSize="$3" color="$color">
                      {unit.med_generic || unit.med_brand}
                    </Text>
                    <Text flex={1} fontSize="$2" color="$gray">
                      {unit.location_name}
                    </Text>
                    <Text flex={1} fontSize="$2" color="$gray" textTransform="capitalize">
                      {unit.status.replace('_', ' ')}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            </ScrollView>
          </Card>
        </Tabs.Content>

        {/* SYSTEM TAB */}
        <Tabs.Content value="system" padding="$4">
          <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
            <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
              System Settings & Data Management
            </H3>
            
            <YStack space="$4">
              <Card padding="$4" backgroundColor="$backgroundHover" space="$3">
                <Text fontSize="$5" fontWeight="600" color="$color">Database Statistics</Text>
                <XStack justifyContent="space-between">
                  <Text color="$gray">Total Locations:</Text>
                  <Text fontWeight="600" color="$color">{locations.length}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray">Total Lots:</Text>
                  <Text fontWeight="600" color="$color">{lots.length}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray">Total Units:</Text>
                  <Text fontWeight="600" color="$color">{units.length}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray">Total Transactions:</Text>
                  <Text fontWeight="600" color="$color">{transactions.length}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray">In Stock Units:</Text>
                  <Text fontWeight="600" color="$green">{units.filter(u => u.status === 'in_stock').length}</Text>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$gray">Dispensed Units:</Text>
                  <Text fontWeight="600" color="$blue">{units.filter(u => u.status === 'dispensed').length}</Text>
                </XStack>
              </Card>

              <Card padding="$4" backgroundColor="$backgroundHover" space="$3">
                <Text fontSize="$5" fontWeight="600" color="$color">Data Export & Backup</Text>
                <Text color="$gray" fontSize="$3">
                  Export all data as JSON for backup or migration purposes.
                </Text>
                <Button
                  backgroundColor="$blue"
                  color="white"
                  icon={<Download size={18} />}
                  onPress={handleExportData}
                >
                  Export Full Database
                </Button>
              </Card>

              <Card padding="$4" backgroundColor="$red" opacity={0.1} space="$3">
                <Text fontSize="$5" fontWeight="600" color="$red">Danger Zone</Text>
                <Text color="$gray" fontSize="$3">
                  Advanced operations that cannot be undone.
                </Text>
                <Button
                  backgroundColor="$red"
                  color="white"
                  disabled
                  opacity={0.5}
                >
                  Bulk Delete (Coming Soon)
                </Button>
              </Card>
            </YStack>
          </Card>
        </Tabs.Content>
      </Tabs>

      {/* MODALS */}
      
      {/* Edit Location Modal */}
      <Modal
        isOpen={showEditLocationModal}
        onClose={() => {
          setShowEditLocationModal(false);
          setEditingLocation(null);
        }}
        title="Edit Location"
      >
        <YStack space="$4">
          <Input 
            size="$4"
            value={editLocationName}
            onChangeText={setEditLocationName}
            placeholder="Location Name"
          />
          <Select 
            value={editLocationTemp}
            onValueChange={(value) => setEditLocationTemp(value as 'room' | 'fridge')}
          >
            <Select.Trigger iconAfter={<ChevronDown size={16} />}>
              <Select.Value />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                <Select.Item index={0} value="room">
                  <Select.ItemText>Room Temp</Select.ItemText>
                </Select.Item>
                <Select.Item index={1} value="fridge">
                  <Select.ItemText>Fridge</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select>
          <Input 
            size="$4"
            value={editLocationCapacity}
            onChangeText={setEditLocationCapacity}
            placeholder="Capacity (optional)"
            inputMode="numeric"
          />
          <XStack justifyContent="flex-end" space="$3">
            <Button onPress={() => setShowEditLocationModal(false)} backgroundColor="$gray" color="white">
              Cancel
            </Button>
            <Button onPress={handleUpdateLocation} backgroundColor="$blue" color="white">
              Update
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Delete Location Confirm */}
      <ConfirmModal
        isOpen={showDeleteLocationConfirm}
        onClose={() => {
          setShowDeleteLocationConfirm(false);
          setDeletingLocation(null);
        }}
        onConfirm={handleDeleteLocation}
        title="Delete Location"
        confirmText="Delete"
        confirmColor="red"
      >
        <Text>Are you sure you want to delete "{deletingLocation?.name}"?</Text>
      </ConfirmModal>

      {/* Edit Lot Modal */}
      <Modal
        isOpen={showEditLotModal}
        onClose={() => {
          setShowEditLotModal(false);
          setEditingLot(null);
        }}
        title="Edit Lot"
      >
        <YStack space="$4">
          <Input 
            size="$4"
            value={editLotDate}
            onChangeText={setEditLotDate}
            placeholder="Date Received"
          />
          <Input 
            size="$4"
            value={editLotSource}
            onChangeText={setEditLotSource}
            placeholder="Source/Donor"
          />
          <Input 
            size="$4"
            value={editLotNotes}
            onChangeText={setEditLotNotes}
            placeholder="Notes"
            multiline
            numberOfLines={3}
          />
          <XStack justifyContent="flex-end" space="$3">
            <Button onPress={() => setShowEditLotModal(false)} backgroundColor="$gray" color="white">
              Cancel
            </Button>
            <Button onPress={handleUpdateLot} backgroundColor="$blue" color="white">
              Update
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Delete Lot Confirm */}
      <ConfirmModal
        isOpen={showDeleteLotConfirm}
        onClose={() => {
          setShowDeleteLotConfirm(false);
          setDeletingLot(null);
        }}
        onConfirm={handleDeleteLot}
        title="Delete Lot"
        confirmText="Delete"
        confirmColor="red"
      >
        <Text>Are you sure you want to delete this lot?</Text>
      </ConfirmModal>

      {/* View Lot Modal */}
      <Modal
        isOpen={showViewLotModal}
        onClose={() => {
          setShowViewLotModal(false);
          setViewingLot(null);
        }}
        title="Lot Details"
      >
        <YStack space="$4">
          <XStack justifyContent="space-between">
            <Text color="$gray">Date Received:</Text>
            <Text fontWeight="600">{viewingLot?.date_received}</Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text color="$gray">Source/Donor:</Text>
            <Text fontWeight="600">{viewingLot?.source_donor}</Text>
          </XStack>
          <XStack justifyContent="space-between">
            <Text color="$gray">Notes:</Text>
            <Text fontWeight="600">{viewingLot?.notes || 'None'}</Text>
          </XStack>
          <Text fontSize="$5" fontWeight="600" color="$color" paddingTop="$3">Associated Units ({viewingLot ? getLotUnits(viewingLot.id).length : 0})</Text>
          <ScrollView maxHeight={300}>
            {viewingLot && getLotUnits(viewingLot.id).map(unit => (
              <XStack key={unit.id} padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
                <Text flex={1} fontSize="$2" fontFamily="$mono">{unit.daana_id}</Text>
                <Text flex={1} fontSize="$3">{unit.med_generic}</Text>
                <Text fontSize="$3" color="$gray">{unit.location_name}</Text>
              </XStack>
            ))}
          </ScrollView>
          <Button onPress={() => setShowViewLotModal(false)} backgroundColor="$blue" color="white">
            Close
          </Button>
        </YStack>
      </Modal>

      {/* Edit Unit Modal */}
      <Modal
        isOpen={showEditUnitModal}
        onClose={() => {
          setShowEditUnitModal(false);
          setEditingUnit(null);
        }}
        title="Edit Unit"
      >
        <YStack space="$4">
          <YStack space="$2">
            <Text color="$gray">Daana ID: {editingUnit?.daana_id}</Text>
            <Text color="$gray">Medication: {editingUnit?.med_generic || editingUnit?.med_brand}</Text>
          </YStack>
          
          <Select 
            value={editUnitLocationId}
            onValueChange={setEditUnitLocationId}
          >
            <Select.Trigger iconAfter={<ChevronDown size={16} />}>
              <Select.Value placeholder="Select Location" />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                {locations.map((loc, idx) => (
                  <Select.Item key={loc.id} index={idx} value={loc.id}>
                    <Select.ItemText>{loc.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
          
          <Select 
            value={editUnitStatus}
            onValueChange={(value) => setEditUnitStatus(value as Unit['status'])}
          >
            <Select.Trigger iconAfter={<ChevronDown size={16} />}>
              <Select.Value />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                {['in_stock', 'partial', 'dispensed', 'expired', 'discarded', 'quarantined'].map((status, idx) => (
                  <Select.Item key={status} index={idx} value={status}>
                    <Select.ItemText>{status.replace('_', ' ')}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
          
          <Input 
            size="$4"
            value={editUnitQty}
            onChangeText={setEditUnitQty}
            placeholder="Quantity"
            inputMode="numeric"
          />
          
          <XStack justifyContent="flex-end" space="$3">
            <Button onPress={() => setShowEditUnitModal(false)} backgroundColor="$gray" color="white">
              Cancel
            </Button>
            <Button onPress={handleUpdateUnit} backgroundColor="$blue" color="white">
              Update
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Delete Unit Confirm */}
      <ConfirmModal
        isOpen={showDeleteUnitConfirm}
        onClose={() => {
          setShowDeleteUnitConfirm(false);
          setDeletingUnit(null);
        }}
        onConfirm={handleDeleteUnit}
        title="Delete Unit"
        confirmText="Delete"
        confirmColor="red"
      >
        <Text>Are you sure you want to delete unit "{deletingUnit?.daana_id}"?</Text>
      </ConfirmModal>

      {/* Batch Move Modal */}
      <Modal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        title="Batch Move Units"
      >
        <YStack space="$4">
          <Text color="$gray">Moving {selectedUnits.size} units</Text>
          <Select 
            value={batchTargetLocation}
            onValueChange={setBatchTargetLocation}
          >
            <Select.Trigger iconAfter={<ChevronDown size={16} />}>
              <Select.Value placeholder="Select Target Location" />
            </Select.Trigger>
            <Select.Content zIndex={200000}>
              <Select.Viewport>
                {locations.map((loc, idx) => (
                  <Select.Item key={loc.id} index={idx} value={loc.id}>
                    <Select.ItemText>{loc.name}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select>
          <XStack justifyContent="flex-end" space="$3">
            <Button onPress={() => setShowBatchModal(false)} backgroundColor="$gray" color="white">
              Cancel
            </Button>
            <Button onPress={handleBatchMove} backgroundColor="$blue" color="white">
              Move
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Info Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalTitle}
      >
        <YStack space="$4">
          <Text paddingVertical="$4">{modalMessage}</Text>
          <XStack justifyContent="flex-end">
            <Button onPress={() => setShowModal(false)} backgroundColor="$blue" color="white">
              OK
            </Button>
          </XStack>
        </YStack>
      </Modal>
    </YStack>
  );
};

export default AdminEnhanced;

