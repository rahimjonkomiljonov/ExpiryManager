// Powered by OnSpace.AI
// Simple event emitter for passing scan results between screens
type ScanResult = {
  barcode: string;
  name: string;
  quantity: string;
  category: string;
  brand: string;
  found: boolean;
};

type Listener = (result: ScanResult) => void;

let listener: Listener | null = null;

export const ScannerEvents = {
  onResult(fn: Listener) {
    listener = fn;
  },
  offResult() {
    listener = null;
  },
  emit(result: ScanResult) {
    listener?.(result);
  },
};
