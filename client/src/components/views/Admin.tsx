import React, { useState } from 'react';
import { YStack, XStack, Button, Input, Text, H2, H3, Card, Select, Adapt, Sheet } from 'tamagui';
import { Check, ChevronDown } from 'lucide-react';
import { ViewType } from '../../types';
import { useFirebase } from '../../context/FirebaseContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import Modal from '../shared/Modal';

interface AdminProps {
  onNavigate: (view: ViewType) => void;
}

const Admin: React.FC<AdminProps> = ({ onNavigate }) => {
  const { locations } = useFirebase();
  
  const [locationName, setLocationName] = useState('');
  const [locationTemp, setLocationTemp] = useState<'room' | 'fridge'>('room');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');

  const showInfoModal = (title: string, message: string) => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };

  const handleAddLocation = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) {
      e.preventDefault();
    }

    const trimmedName = locationName.trim();
    if (!trimmedName) {
      showInfoModal('Validation Error', 'Location name is required.');
      return;
    }
    
    try {
      const locData = {
        name: trimmedName,
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
        
        <form onSubmit={handleAddLocation} style={{ width: '100%' }}>
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
            onPress={() => handleAddLocation()}
          >
            Add
          </Button>
        </XStack>
        </form>
        
        <YStack borderWidth={1} borderColor="$borderColor" borderRadius="$4" overflow="hidden">
          {/* Table Header */}
          <XStack backgroundColor="$backgroundHover" padding="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
            <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Name</Text>
            <Text flex={1} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Temp</Text>
            <Text flex={2} fontSize="$2" fontWeight="500" color="$gray" textTransform="uppercase">Location ID</Text>
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
              >
                <Text flex={2} fontSize="$3" fontWeight="500" color="$color">
                  {location.name}
                </Text>
                <Text flex={1} fontSize="$3" color="$gray" textTransform="capitalize">
                  {location.temp_type}
                </Text>
                <Text flex={2} fontSize="$3" color="$gray" fontFamily="$mono">
                  {location.id}
                </Text>
              </XStack>
            ))
          )}
        </YStack>
      </Card>
      
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

