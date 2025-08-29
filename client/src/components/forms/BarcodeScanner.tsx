import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, Hash, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Import QuaggaJS types
declare global {
  interface Window {
    Quagga: any;
  }
}

interface BarcodeScannerProps {
  onBarcodeResult: (barcodeData: any) => void;
}

export default function BarcodeScanner({ onBarcodeResult }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [quaggaLoaded, setQuaggaLoaded] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load QuaggaJS dynamically
  useEffect(() => {
    const loadQuagga = async () => {
      if (window.Quagga) {
        setQuaggaLoaded(true);
        return;
      }

      try {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/quagga@0.12.1/dist/quagga.min.js';
        script.onload = () => setQuaggaLoaded(true);
        script.onerror = () => {
          console.error('Failed to load QuaggaJS');
          toast({
            title: "Scanner Error",
            description: "Failed to load barcode scanner. Please try manual entry.",
            variant: "destructive",
          });
        };
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading QuaggaJS:', error);
      }
    };

    loadQuagga();
  }, [toast]);

  // Barcode lookup query
  const { data: barcodeData, refetch: lookupBarcode, isFetching } = useQuery({
    queryKey: ["/api/barcode", scannedBarcode || manualBarcode],
    enabled: false,
  });

  // Handle successful barcode lookup
  useEffect(() => {
    if (barcodeData) {
      onBarcodeResult(barcodeData);
      toast({
        title: "Product Found!",
        description: `Found: ${barcodeData.name}`,
      });
    }
  }, [barcodeData, onBarcodeResult, toast]);

  const startScanning = useCallback(() => {
    if (!quaggaLoaded || !window.Quagga || !scannerRef.current) {
      toast({
        title: "Scanner Not Ready",
        description: "Please wait for scanner to load or try manual entry.",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);

    window.Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        }
      },
      locator: {
        patchSize: "medium",
        halfSample: true
      },
      numOfWorkers: 2,
      frequency: 10,
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      },
      locate: true
    }, (err: any) => {
      if (err) {
        console.error('QuaggaJS initialization failed:', err);
        setIsScanning(false);
        toast({
          title: "Scanner Error",
          description: "Failed to initialize camera scanner. Please try manual entry.",
          variant: "destructive",
        });
        return;
      }
      window.Quagga.start();
    });

    // Handle successful barcode detection
    window.Quagga.onDetected((data: any) => {
      const code = data.codeResult.code;
      setScannedBarcode(code);
      stopScanning();
      lookupBarcode();
    });
  }, [quaggaLoaded, lookupBarcode, toast]);

  const stopScanning = useCallback(() => {
    if (window.Quagga) {
      window.Quagga.stop();
    }
    setIsScanning(false);
  }, []);

  const handleManualLookup = useCallback(() => {
    if (manualBarcode.trim()) {
      lookupBarcode();
    }
  }, [manualBarcode, lookupBarcode]);

  return (
    <div className="space-y-4">
      {isScanning ? (
        <Card className="overflow-hidden" data-testid="barcode-scanner-active">
          <CardContent className="p-0">
            <div className="relative">
              <div 
                ref={scannerRef} 
                className="w-full h-64 bg-black flex items-center justify-center"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-32 border-2 border-accent border-dashed rounded-lg flex items-center justify-center">
                  <ScanLine className="w-8 h-8 text-accent animate-pulse" />
                </div>
              </div>
            </div>
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Position barcode within the frame
              </p>
              <Button 
                variant="outline"
                onClick={stopScanning}
                data-testid="button-stop-scanning"
              >
                Stop Scanning
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Camera Scanner Option */}
          <Card className="border-2 border-dashed border-border hover:border-accent transition-colors" data-testid="barcode-scanner-options">
            <CardContent className="p-8 text-center">
              <ScanLine className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Scan Barcode</h3>
              <p className="text-muted-foreground mb-6">
                Use your camera to scan product barcodes
              </p>
              <Button 
                className="btn-gradient"
                onClick={startScanning}
                disabled={!quaggaLoaded}
                data-testid="button-start-barcode-scan"
              >
                <ScanLine className="w-4 h-4 mr-2" />
                {quaggaLoaded ? "Start Scanner" : "Loading Scanner..."}
              </Button>
            </CardContent>
          </Card>

          {/* Manual Entry Option */}
          <Card data-testid="manual-barcode-entry">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Hash className="w-5 h-5 text-muted-foreground" />
                <Label className="text-base font-semibold">Manual Barcode Entry</Label>
              </div>
              <div className="flex space-x-2">
                <Input
                  placeholder="Enter barcode number (e.g., 1234567890123)"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualLookup()}
                  data-testid="input-manual-barcode"
                />
                <Button 
                  onClick={handleManualLookup}
                  disabled={!manualBarcode.trim() || isFetching}
                  data-testid="button-lookup-barcode"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {isFetching ? "Looking up..." : "Lookup"}
                </Button>
              </div>
              {scannedBarcode && (
                <p className="text-sm text-muted-foreground mt-2">
                  Last scanned: {scannedBarcode}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Product Information Display */}
          {barcodeData && (
            <Card className="border-success/20 bg-success/5" data-testid="barcode-result">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {barcodeData.image && (
                    <img 
                      src={barcodeData.image} 
                      alt={barcodeData.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{barcodeData.name}</h3>
                    {barcodeData.brand && (
                      <p className="text-sm text-muted-foreground">{barcodeData.brand}</p>
                    )}
                    {barcodeData.nutrition && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium">Nutrition per 100g:</span>
                        {barcodeData.nutrition.energy && (
                          <span className="ml-2">{Math.round(barcodeData.nutrition.energy)} kcal</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
