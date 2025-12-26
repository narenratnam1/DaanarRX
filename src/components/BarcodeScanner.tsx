'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, AlertCircle, Keyboard } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  const scannerId = 'barcode-reader';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const mountedRef = useRef(true);

  // Cleanup function to stop all camera streams
  const stopAllCameraStreams = useCallback(async () => {
    try {
      // Stop the Html5Qrcode scanner if it exists
      if (scannerRef.current) {
        try {
          const state = scannerRef.current.getState();
          if (state === 2) { // Html5QrcodeScannerState.SCANNING
            await scannerRef.current.stop();
          }
        } catch (err) {
          // Scanner might already be stopped
          console.log('Scanner already stopped or not started');
        }
        try {
          await scannerRef.current.clear();
        } catch (err) {
          // Ignore clear errors
        }
        scannerRef.current = null;
      }

      // Additionally, stop any lingering media streams
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      if (videoDevices.length > 0) {
        // Get all video elements and stop their streams
        const videoElements = document.querySelectorAll('video');
        videoElements.forEach(video => {
          if (video.srcObject) {
            const stream = video.srcObject as MediaStream;
            stream.getTracks().forEach(track => {
              track.stop();
            });
            video.srcObject = null;
          }
        });
      }

      if (mountedRef.current) {
        setIsScanning(false);
      }
    } catch (err) {
      console.error('Error stopping camera streams:', err);
    }
  }, []);

  // Effect to handle modal open/close
  useEffect(() => {
    mountedRef.current = true;

    if (!opened) {
      // Modal is closing, stop everything
      stopAllCameraStreams();
      if (mountedRef.current) {
        setShowManualInput(false);
        setManualCode('');
        setError('');
      }
      return;
    }

    // Modal is opening, start scanner after a short delay to ensure DOM is ready
    const startTimer = setTimeout(() => {
      if (mountedRef.current && opened) {
        startScanner();
      }
    }, 100);

    return () => {
      clearTimeout(startTimer);
      mountedRef.current = false;
      stopAllCameraStreams();
    };
  }, [opened, stopAllCameraStreams]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopAllCameraStreams();
    };
  }, [stopAllCameraStreams]);

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera is not supported on this browser. Please use manual entry.');
        return false;
      }

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
    if (!mountedRef.current) return;

    try {
      setIsScanning(true);
      setError('');

      const hasPermission = await requestCameraPermission();
      if (!hasPermission || !mountedRef.current) {
        setIsScanning(false);
        setShowManualInput(true);
        return;
      }

      // Make sure any previous instance is cleaned up
      await stopAllCameraStreams();

      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          if (mountedRef.current) {
            handleScan(decodedText);
          }
        },
        () => {
          // Ignore decode errors (continuous scanning)
        }
      );
    } catch (err: any) {
      console.error('Error starting barcode scanner:', err);
      if (mountedRef.current) {
        setError('Failed to start camera. Please check permissions or use manual entry.');
        setIsScanning(false);
        setShowManualInput(true);
      }
    }
  };

  const handleScan = async (code: string) => {
    await stopAllCameraStreams();
    onScan(code);
  };

  const handleManualSubmit = async () => {
    if (manualCode.trim()) {
      await stopAllCameraStreams();
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleClose = async () => {
    await stopAllCameraStreams();
    onClose();
  };

  const handleSwitchToManual = async () => {
    await stopAllCameraStreams();
    setShowManualInput(true);
  };

  const handleSwitchToScanner = () => {
    setShowManualInput(false);
    setManualCode('');
    startScanner();
  };

  return (
    <Dialog open={opened} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[600px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!showManualInput ? (
            <>
              <div
                id={scannerId}
                className="w-full min-h-[300px] rounded-lg overflow-hidden"
              />

              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSwitchToManual}
                  className="w-full sm:w-auto"
                >
                  <Keyboard className="mr-2 h-4 w-4" />
                  Manual Entry
                </Button>
                <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="manual-code">NDC Barcode</Label>
                <Input
                  id="manual-code"
                  placeholder="Enter NDC code manually"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleManualSubmit();
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSwitchToScanner}
                  className="w-full sm:w-auto"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Back to Scanner
                </Button>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button onClick={handleManualSubmit} className="w-full sm:w-auto">
                    Submit
                  </Button>
                  <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
