import React from 'react';
import { YStack, XStack, Button, Text, Card } from 'tamagui';
import { Package, MapPin, Calendar, Hash, Info } from 'lucide-react';
import { Unit } from '../../types';
import Modal from './Modal';

interface UnitPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unit: Unit | null;
  locationName?: string;
}

const UnitPreviewModal: React.FC<UnitPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  unit,
  locationName
}) => {
  if (!unit) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Unit Details">
      <YStack space="$4">
        <Card padding="$4" backgroundColor="$backgroundHover" borderRadius="$4">
          <YStack space="$3">
            {/* Medication Name */}
            <XStack alignItems="center" space="$2">
              <Package size={20} color="var(--color-blue-10)" />
              <YStack flex={1}>
                <Text fontSize="$2" color="$gray">Medication</Text>
                <Text fontSize="$5" fontWeight="600" color="$color">
                  {unit.med_generic} {unit.strength}
                </Text>
                <Text fontSize="$3" color="$gray">{unit.form}</Text>
              </YStack>
            </XStack>

            {/* Daana ID */}
            <XStack alignItems="center" space="$2" paddingTop="$2" borderTopWidth={1} borderTopColor="$borderColor">
              <Hash size={20} color="var(--color-gray-10)" />
              <YStack flex={1}>
                <Text fontSize="$2" color="$gray">Daana ID</Text>
                <Text fontSize="$3" fontFamily="$mono" color="$color">
                  {unit.daana_id}
                </Text>
              </YStack>
            </XStack>

            {/* Quantity */}
            <XStack alignItems="center" space="$2">
              <Info size={20} color="var(--color-green-10)" />
              <YStack flex={1}>
                <Text fontSize="$2" color="$gray">Available Quantity</Text>
                <Text fontSize="$4" fontWeight="600" color="$green">
                  {unit.qty_total} units
                </Text>
              </YStack>
            </XStack>

            {/* Location */}
            <XStack alignItems="center" space="$2">
              <MapPin size={20} color="var(--color-purple-10)" />
              <YStack flex={1}>
                <Text fontSize="$2" color="$gray">Location</Text>
                <Text fontSize="$3" color="$color">
                  {locationName || 'Unknown'}
                </Text>
              </YStack>
            </XStack>

            {/* Expiration Date */}
            <XStack alignItems="center" space="$2">
              <Calendar size={20} color="var(--color-red-10)" />
              <YStack flex={1}>
                <Text fontSize="$2" color="$gray">Expires</Text>
                <Text fontSize="$3" color="$color">
                  {unit.exp_date}
                </Text>
              </YStack>
            </XStack>

            {/* Status */}
            <XStack alignItems="center" space="$2">
              <YStack 
                width={20} 
                height={20} 
                borderRadius="$10" 
                backgroundColor={unit.status === 'in_stock' ? '$green' : unit.status === 'partial' ? '$yellow' : '$gray'}
              />
              <YStack flex={1}>
                <Text fontSize="$2" color="$gray">Status</Text>
                <Text fontSize="$3" color="$color" textTransform="capitalize">
                  {unit.status.replace('_', ' ')}
                </Text>
              </YStack>
            </XStack>

            {/* Brand Name if available */}
            {unit.med_brand && unit.med_brand !== 'N/A' && (
              <XStack alignItems="center" space="$2" paddingTop="$2" borderTopWidth={1} borderTopColor="$borderColor">
                <YStack flex={1}>
                  <Text fontSize="$2" color="$gray">Brand Name</Text>
                  <Text fontSize="$3" color="$color">
                    {unit.med_brand}
                  </Text>
                </YStack>
              </XStack>
            )}

            {/* NDC if available */}
            {unit.ndc && (
              <XStack alignItems="center" space="$2">
                <YStack flex={1}>
                  <Text fontSize="$2" color="$gray">NDC</Text>
                  <Text fontSize="$3" fontFamily="$mono" color="$color">
                    {unit.ndc}
                  </Text>
                </YStack>
              </XStack>
            )}
          </YStack>
        </Card>

        {/* Warning if low stock */}
        {unit.qty_total < 5 && (
          <Card padding="$3" backgroundColor="rgba(245, 158, 11, 0.1)" borderWidth={1} borderColor="$yellow">
            <Text fontSize="$3" color="$yellow" textAlign="center">
              ⚠️ Low stock warning: Only {unit.qty_total} units remaining
            </Text>
          </Card>
        )}

        {/* Action Buttons */}
        <XStack space="$3" paddingTop="$2" $xs={{ flexDirection: "column" }}>
          <Button 
            flex={1}
            size="$4"
            onPress={onClose}
            backgroundColor="$gray"
            color="white"
            hoverStyle={{ backgroundColor: "#4b5563" }}
            pressStyle={{ backgroundColor: "#374151" }}
            $xs={{ width: "100%" }}
          >
            Cancel
          </Button>
          <Button 
            flex={1}
            size="$4"
            onPress={handleConfirm}
            backgroundColor="$blue"
            color="white"
            hoverStyle={{ opacity: 0.9 }}
            pressStyle={{ opacity: 0.8 }}
            $xs={{ width: "100%" }}
          >
            Continue to Checkout
          </Button>
        </XStack>
      </YStack>
    </Modal>
  );
};

export default UnitPreviewModal;

