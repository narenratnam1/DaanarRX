import React, { useState } from 'react';
import { YStack, XStack, Button, Input, Text, H2, H3, Card, Select, Adapt, Sheet } from 'tamagui';
import { Check, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { ViewType, Location } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';

interface AdminProps {
  onNavigate: (view: ViewType) => void;
}

const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const { locations, units } = useFirebase();
  
  const [locationName, setLocationName] = useState('');
  const [locationTemp, setLocationTemp] = useState<'room' | 'fridge'>('room');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  // Edit location state
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [editLocationName, setEditLocationName] = useState('');
  const [editLocationTemp, setEditLocationTemp] = useState<'room' | 'fridge'>('room');
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Delete confirmation state
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showInfoModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const handleAddLocation = async () => {
    if (!locationName.trim()) {
      showInfoModal('Error', 'Please enter a location name.');
      return;
    }
    
    try {
      const locData = {
        name: locationName,
        temp_type: locationTemp,
        is_active: true
      };
      
      await addDoc(collection(db, 'locations'), locData);
      showInfoModal('Success', `Location "${locationName}" added.`);
      setLocationName('');
      setLocationTemp('room');
    } catch (error: any) {
      console.error('Error adding location:', error);
      showInfoModal('Error', `Could not add location: ${error.message}`);
    }
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setEditLocationName(location.name);
    setEditLocationTemp(location.temp_type);
    setShowEditModal(true);
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation) return;

    try {
      const locationRef = doc(db, 'locations', editingLocation.id);
      await updateDoc(locationRef, {
        name: editLocationName,
        temp_type: editLocationTemp
      });
      
      showInfoModal('Success', `Location "${editLocationName}" updated.`);
      setShowEditModal(false);
      setEditingLocation(null);
      setEditLocationName('');
      setEditLocationTemp('room');
    } catch (error: any) {
      console.error('Error updating location:', error);
      showInfoModal('Error', `Could not update location: ${error.message}`);
    }
  };

  const handleDeleteClick = (location: Location) => {
    setDeletingLocation(location);
    setShowDeleteConfirm(true);
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;

    try {
      // Check if location is in use by any units
      const unitsUsingLocation = units.filter(unit => unit.location_id === deletingLocation.id);
      
      if (unitsUsingLocation.length > 0) {
        showInfoModal(
          'Cannot Delete Location', 
          `This location cannot be deleted because it is currently in use by ${unitsUsingLocation.length} unit(s). Please move or remove these units first.`
        );
        setShowDeleteConfirm(false);
        setDeletingLocation(null);
        return;
      }

      // Delete the location
      const locationRef = doc(db, 'locations', deletingLocation.id);
      await deleteDoc(locationRef);
      
      showInfoModal('Success', `Location "${deletingLocation.name}" deleted.`);
      setShowDeleteConfirm(false);
      setDeletingLocation(null);
    } catch (error: any) {
      console.error('Error deleting location:', error);
      showInfoModal('Error', `Could not delete location: ${error.message}`);
      setShowDeleteConfirm(false);
      setDeletingLocation(null);
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
        Admin
      </H2>
      
      {/* Manage Locations */}
      <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" space="$4">
        <H3 fontSize="$7" fontWeight="600" color="$color" borderBottomWidth={1} borderBottomColor="$borderColor" paddingBottom="$2">
          Manage Locations
        </H3>
        
        <XStack space="$2" $xs={{ flexDirection: "column" }}>
          <Input 
            flex={1}
            size="$4"
            value={locationName}
            onChangeText={setLocationName}
            placeholder="New Location Name (e.g., A-1-1)"
            borderColor="$borderColor"
            focusStyle={{ borderColor: "$blue" }}
            $xs={{ width: "100%" }}
          />
          <Select 
            value={locationTemp}
            onValueChange={(value) => setLocationTemp(value as 'room' | 'fridge')}
          >
            <Select.Trigger width={150} iconAfter={<ChevronDown size={16} />} $xs={{ width: "100%" }}>
              <Select.Value placeholder="Temp Type" />
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
                <Select.Item index={0} value="room">
                  <Select.ItemText>Room Temp</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
                <Select.Item index={1} value="fridge">
                  <Select.ItemText>Fridge</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check size={16} />
                  </Select.ItemIndicator>
                </Select.Item>
              </Select.Viewport>
              <Select.ScrollDownButton />
            </Select.Content>
          </Select>
          <Button 
            size="$4"
            backgroundColor="$blue"
            color="white"
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            $xs={{ width: "100%" }}
            onPress={handleAddLocation}
          >
            Add
          </Button>
        </XStack>
        
        <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden">
          {/* Table Header */}
          <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
            <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Name</Text>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Temp</Text>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Location ID</Text>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase" textAlign="center">Actions</Text>
          </XStack>
          
          {/* Table Body */}
          {locations.length === 0 ? (
            <YStack padding="$6" alignItems="center">
              <Text color="$gray" textAlign="center">
                No locations found. Add one!
              </Text>
            </YStack>
          ) : (
            locations.map(location => (
              <XStack 
                key={location.id}
                padding="$3"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
                hoverStyle={{ backgroundColor: "$backgroundHover" }}
                alignItems="center"
              >
                <Text flex={2} fontSize="$3" fontWeight="500" color="$color">
                  {location.name}
                </Text>
                <Text flex={1} fontSize="$3" color="$gray" textTransform="capitalize">
                  {location.temp_type}
                </Text>
                <Text flex={1} fontSize="$2" color="$gray" fontFamily="$mono">
                  {location.id.substring(0, 8)}...
                </Text>
                <XStack flex={1} justifyContent="center" space="$2">
                  <Button
                    size="$3"
                    backgroundColor="$blue"
                    color="white"
                    hoverStyle={{ opacity: 0.9 }}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => handleEditLocation(location)}
                    icon={<Edit2 size={14} />}
                    circular
                  />
                  <Button
                    size="$3"
                    backgroundColor="$red"
                    color="white"
                    hoverStyle={{ opacity: 0.9 }}
                    pressStyle={{ opacity: 0.8 }}
                    onPress={() => handleDeleteClick(location)}
                    icon={<Trash2 size={14} />}
                    circular
                  />
                </XStack>
              </XStack>
            ))
          )}
        </YStack>
      </Card>
      
      {/* Edit Location Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingLocation(null);
          setEditLocationName('');
          setEditLocationTemp('room');
        }}
        title="Edit Location"
      >
        <YStack space="$4">
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="500" color="$color">Location Name</Text>
            <Input 
              size="$4"
              value={editLocationName}
              onChangeText={setEditLocationName}
              placeholder="Location Name (e.g., A-1-1)"
              borderColor="$borderColor"
              focusStyle={{ borderColor: "$blue" }}
            />
          </YStack>
          
          <YStack space="$3">
            <Text fontSize="$3" fontWeight="500" color="$color">Temperature Type</Text>
            <Select 
              value={editLocationTemp}
              onValueChange={(value) => setEditLocationTemp(value as 'room' | 'fridge')}
            >
              <Select.Trigger width="100%" iconAfter={<ChevronDown size={16} />}>
                <Select.Value placeholder="Temp Type" />
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
                  <Select.Item index={0} value="room">
                    <Select.ItemText>Room Temp</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                  <Select.Item index={1} value="fridge">
                    <Select.ItemText>Fridge</Select.ItemText>
                    <Select.ItemIndicator>
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                </Select.Viewport>
                <Select.ScrollDownButton />
              </Select.Content>
            </Select>
          </YStack>
          
          <XStack justifyContent="flex-end" space="$3" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
            <Button 
              onPress={() => {
                setShowEditModal(false);
                setEditingLocation(null);
                setEditLocationName('');
                setEditLocationTemp('room');
              }}
              backgroundColor="$gray"
              color="white"
              size="$4"
              hoverStyle={{ backgroundColor: "#4b5563" }}
              pressStyle={{ backgroundColor: "#374151" }}
            >
              Cancel
            </Button>
            <Button 
              onPress={handleUpdateLocation}
              backgroundColor="$blue"
              color="white"
              size="$4"
              hoverStyle={{ opacity: 0.9 }}
              pressStyle={{ opacity: 0.8 }}
              disabled={!editLocationName.trim()}
            >
              Update
            </Button>
          </XStack>
        </YStack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingLocation(null);
        }}
        onConfirm={handleDeleteLocation}
        title="Delete Location"
        confirmText="Delete"
        confirmColor="red"
      >
        <YStack space="$3">
          <Text color="$color">
            Are you sure you want to delete the location <Text fontWeight="600">"{deletingLocation?.name}"</Text>?
          </Text>
          {deletingLocation && units.filter(u => u.location_id === deletingLocation.id).length > 0 && (
            <Text color="$red" fontSize="$3">
              ⚠️ Warning: This location is currently in use by {units.filter(u => u.location_id === deletingLocation.id).length} unit(s). 
              Deletion will be prevented.
            </Text>
          )}
        </YStack>
      </ConfirmModal>

      {/* Info Modal */}
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

export default Admin;

