import React, { useState } from 'react';
import { YStack, XStack, Button, Input, Label, Text, Card } from 'tamagui';
import { Camera, Search } from 'lucide-react';
import { getButtonProps } from '../../theme/buttonStyles';
import BarcodeScanner from './BarcodeScanner';

interface ScanLookupCardProps {
  onScan: (barcode: string) => void;
  onManualLookup?: (value: string) => void;
  placeholder?: string;
  label?: string;
  scannerTitle?: string;
  showManualLookup?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

/**
 * Reusable ScanLookupCard component for barcode scanning and manual lookup
 * Used across CheckOut, Scan, and other screens that need QR/barcode scanning
 */
const ScanLookupCard: React.FC<ScanLookupCardProps> = ({
  onScan,
  onManualLookup,
  placeholder = "Scan or enter code",
  label = "Scan Code",
  scannerTitle = "Scan Barcode",
  showManualLookup = true,
  value = '',
  onValueChange,
}) => {
  const [showScanner, setShowScanner] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  const handleBarcodeScanned = (barcode: string) => {
    if (onValueChange) {
      onValueChange(barcode);
    } else {
      setInputValue(barcode);
    }
    onScan(barcode);
  };

  const handleManualLookup = () => {
    const valueToLookup = onValueChange ? value : inputValue;
    if (onManualLookup && valueToLookup.trim()) {
      onManualLookup(valueToLookup);
    }
  };

  const handleInputChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    } else {
      setInputValue(val);
    }
  };

  const displayValue = onValueChange ? value : inputValue;

  return (
    <>
      <Card 
        elevate 
        backgroundColor="$background" 
        padding="$4" 
        borderRadius="$4" 
        maxWidth={600} 
        width="100%" 
        marginHorizontal="auto"
        $xs={{ maxWidth: "100%" }}
      >
        <YStack space="$4">
          <YStack space="$2">
            <Label htmlFor="scan-input" fontSize="$3" fontWeight="500" color="$color">
              {label}
            </Label>
            <XStack space="$2" $xs={{ flexDirection: "column" }}>
              <Input 
                id="scan-input"
                flex={1}
                size="$4"
                value={displayValue}
                onChangeText={handleInputChange}
                placeholder={placeholder}
                borderColor="$borderColor"
                focusStyle={{ borderColor: "$blue8", borderWidth: 2 }}
                $xs={{ width: "100%", marginBottom: "$2" }}
                aria-label={label}
              />
              {showManualLookup && (
                <Button 
                  {...getButtonProps('primary')}
                  size="$4"
                  disabled={!displayValue || displayValue.trim().length === 0}
                  onPress={handleManualLookup}
                  icon={<Search size={20} />}
                  $xs={{ width: "100%", marginBottom: "$2" }}
                  aria-label="Lookup code"
                >
                  Lookup
                </Button>
              )}
              <Button 
                {...getButtonProps('primary')}
                size="$4"
                onPress={() => setShowScanner(true)}
                icon={<Camera size={20} />}
                $xs={{ width: "100%" }}
                aria-label="Open camera scanner"
              >
                Camera
              </Button>
            </XStack>
          </YStack>
          
          <Text fontSize="$2" color="$gray10" textAlign="center">
            Scan a DaanaRX QR code or enter a code manually
          </Text>
        </YStack>
      </Card>

      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScanned}
        title={scannerTitle}
      />
    </>
  );
};

export default ScanLookupCard;

