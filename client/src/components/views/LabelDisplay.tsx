import React, { useRef } from 'react';
import { YStack, XStack, Button, Text, H2, Card } from 'tamagui';
import { Package, MapPin, Calendar, Printer, Home, PlusCircle } from 'lucide-react';
import { ViewType, Unit } from '../../types';
import { getButtonProps } from '../../theme/buttonStyles';

interface LabelDisplayProps {
  onNavigate: (view: ViewType) => void;
  unit: Unit | null;
  locationName: string;
}

const LabelDisplay: React.FC<LabelDisplayProps> = ({ onNavigate, unit, locationName }) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!unit) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" space="$4">
        <Text fontSize="$6" color="$gray">No label to display</Text>
        <Button {...getButtonProps('secondary')} onPress={() => onNavigate('check-in')}>
          Back to Check-In
        </Button>
      </YStack>
    );
  }

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>DaanaRX Label - ${unit.daana_id}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                .label-container {
                  border: 2px solid #000;
                  padding: 20px;
                  max-width: 400px;
                  page-break-inside: avoid;
                }
                .qr-code {
                  text-align: center;
                  margin: 20px 0;
                }
                .qr-code img {
                  max-width: 200px;
                  height: auto;
                }
                .label-info {
                  margin: 10px 0;
                  line-height: 1.6;
                }
                .label-title {
                  font-size: 18px;
                  font-weight: bold;
                  margin-bottom: 15px;
                  text-align: center;
                }
                .info-row {
                  margin: 8px 0;
                  display: flex;
                  justify-content: space-between;
                }
                .info-label {
                  font-weight: bold;
                  min-width: 120px;
                }
                @media print {
                  body { margin: 0; }
                  .label-container { border: 2px solid #000; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
              <script>
                window.onload = function() {
                  window.print();
                  window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  const handleDownloadQR = () => {
    // Create a canvas to generate QR code image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const qrImage = document.getElementById('qr-code-image') as HTMLImageElement;
    
    if (ctx && qrImage) {
      canvas.width = qrImage.width;
      canvas.height = qrImage.height;
      ctx.drawImage(qrImage, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `DaanaRX-${unit.daana_id}.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  return (
    <YStack flex={1} space="$4" paddingVertical="$4">
      {/* Header with navigation */}
      <XStack justifyContent="space-between" alignItems="center" flexWrap="wrap" gap="$2" $xs={{ flexDirection: "column" }}>
        <Button 
          {...getButtonProps('secondary')}
          size="$4"
          icon={<Home size={20} />}
          onPress={() => onNavigate('home')}
          $xs={{ width: "100%" }}
          aria-label="Go to home"
        >
          Home
        </Button>
        <H2 fontSize="$9" fontWeight="600" color="$color" $xs={{ fontSize: "$8", width: "100%" }}>
          Label Generated Successfully
        </H2>
        <Button 
          {...getButtonProps('primary')}
          size="$4"
          icon={<PlusCircle size={20} />}
          onPress={() => onNavigate('check-in')}
          $xs={{ width: "100%" }}
          aria-label="Check in another unit"
        >
          Check In Another
        </Button>
      </XStack>

      {/* Label Preview Card */}
      <Card elevate backgroundColor="$background" padding="$6" borderRadius="$4" maxWidth={600} width="100%" marginHorizontal="auto">
        <YStack space="$4" ref={printRef}>
          <div className="label-container">
            <div className="label-title">DaanaRX Unit Label</div>
            
            {/* QR Code */}
            <div className="qr-code">
              <img 
                id="qr-code-image"
                src={unit.qr_code_image || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(unit.qr_code_value)}`}
                alt="QR Code"
              />
            </div>

            {/* Unit Information */}
            <div className="label-info">
              <div className="info-row">
                <span className="info-label">Daana ID:</span>
                <span>{unit.daana_id}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Medication:</span>
                <span>{unit.med_generic}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Strength:</span>
                <span>{unit.strength}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Form:</span>
                <span>{unit.form}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Quantity:</span>
                <span>{unit.qty_total} units</span>
              </div>
              <div className="info-row">
                <span className="info-label">Location:</span>
                <span>{locationName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Expires:</span>
                <span>{unit.exp_date}</span>
              </div>
              {unit.med_brand && (
                <div className="info-row">
                  <span className="info-label">Brand:</span>
                  <span>{unit.med_brand}</span>
                </div>
              )}
              {unit.ndc && (
                <div className="info-row">
                  <span className="info-label">NDC:</span>
                  <span>{unit.ndc}</span>
                </div>
              )}
            </div>
          </div>
        </YStack>

        {/* Action Buttons */}
        <XStack space="$3" paddingTop="$4" justifyContent="center" flexWrap="wrap">
          <Button 
            {...getButtonProps('primary')}
            size="$5"
            icon={<Printer size={20} />}
            onPress={handlePrint}
            flex={1}
            minWidth={200}
            $xs={{ width: "100%" }}
            aria-label="Print label"
          >
            Print Label
          </Button>
          <Button 
            {...getButtonProps('secondary')}
            size="$5"
            onPress={handleDownloadQR}
            flex={1}
            minWidth={200}
            $xs={{ width: "100%" }}
            aria-label="Download QR code"
          >
            Download QR Code
          </Button>
        </XStack>
      </Card>

      {/* Success Message */}
      <Card backgroundColor="$green2" padding="$4" borderWidth={1} borderColor="$green8" borderRadius="$4" maxWidth={600} width="100%" marginHorizontal="auto">
        <XStack alignItems="center" space="$3">
          <Package size={24} color="var(--color-green-10)" />
          <YStack flex={1}>
            <Text fontSize="$5" fontWeight="600" color="$green11">
              Unit Added to Inventory
            </Text>
            <Text fontSize="$3" color="$gray11">
              The unit has been successfully added and is now available in your inventory.
            </Text>
          </YStack>
        </XStack>
      </Card>
    </YStack>
  );
};

export default LabelDisplay;

