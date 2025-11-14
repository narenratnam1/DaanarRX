'use client';

import { useEffect, useRef, useState } from 'react';
import { Modal, Button, Group, Text, Stack, Alert } from '@mantine/core';
import { IconCamera, IconAlertCircle } from '@tabler/icons-react';
import Quagga from '@ericblade/quagga2';

interface BarcodeScannerProps {
  opened: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  description?: string;
}

export function BarcodeScanner({
  opened,
  onClose,
  onScan,
  title = 'Scan NDC Barcode',
  description = 'Position the barcode within the frame',
}: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [lastScan, setLastScan] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState(0);

  useEffect(() => {
    if (!opened) {
      stopScanner();
      return;
    }

    startScanner();

    return () => {
      stopScanner();
    };
  }, [opened]);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Check if navigator.mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported on this browser. Please use manual entry.');
        return false;
      }

      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      // Stop the test stream immediately
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      console.error('Camera permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission denied. Please enable camera access in your browser settings and reload.');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device. Please use manual entry.');
      } else if (err.name === 'NotReadableError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera. Please check permissions or use manual entry.');
      }
      return false;
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      // Request camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsScanning(false);
        return;
      }

      await Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: scannerRef.current,
            constraints: {
              width: 640,
              height: 480,
              facingMode: 'environment',
            },
          },
          decoder: {
            readers: [
              'code_128_reader',
              'ean_reader',
              'ean_8_reader',
              'code_39_reader',
              'code_39_vin_reader',
              'codabar_reader',
              'upc_reader',
              'upc_e_reader',
            ],
          },
          locate: true,
        },
        (err) => {
          if (err) {
            console.error('Error initializing Quagga:', err);
            setError('Failed to initialize camera. Please check permissions or use manual entry.');
            setIsScanning(false);
            return;
          }
          Quagga.start();
        }
      );

      Quagga.onDetected(handleDetected);
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start scanner. Please ensure camera permissions are granted or use manual entry.');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (isScanning) {
      Quagga.stop();
      Quagga.offDetected(handleDetected);
      setIsScanning(false);
    }
  };

  const handleDetected = (result: any) => {
    if (result && result.codeResult && result.codeResult.code) {
      const code = result.codeResult.code;
      
      // Avoid duplicate scans
      if (code === lastScan) return;
      
      setLastScan(code);
      setScanAttempts((prev) => prev + 1);
      
      // Stop scanner and pass the code
      stopScanner();
      onScan(code);
    }
  };

  const handleManualEntry = () => {
    stopScanner();
    onClose();
  };

  const handleRetry = () => {
    setError('');
    setLastScan('');
    startScanner();
  };

  return (
    <Modal
      opened={opened}
      onClose={() => {
        stopScanner();
        onClose();
      }}
      title={title}
      size="lg"
      centered
    >
      <Stack>
        <Text size="sm" c="dimmed">
          {description}
        </Text>

        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
            {error}
          </Alert>
        )}

        {scanAttempts >= 2 && !error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Having trouble?" color="orange">
            After 2 failed attempts, you can switch to manual entry.
          </Alert>
        )}

        <div
          ref={scannerRef}
          style={{
            width: '100%',
            height: '400px',
            backgroundColor: '#000',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {!isScanning && !error && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <IconCamera size={48} />
              <Text mt="md">Initializing camera...</Text>
            </div>
          )}
        </div>

        <Group justify="space-between">
          <Button variant="subtle" onClick={handleManualEntry}>
            Manual Entry
          </Button>
          <Group>
            {error && (
              <Button variant="light" onClick={handleRetry}>
                Retry
              </Button>
            )}
            <Button
              onClick={() => {
                stopScanner();
                onClose();
              }}
            >
              Cancel
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}

