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
let pendingResult: ScanResult | null = null;

export const ScannerEvents = {
  onResult(fn: Listener) {
    listener = fn;
    // Deliver any result that arrived before the listener was registered
    if (pendingResult) {
      const result = pendingResult;
      pendingResult = null;
      fn(result);
    }
  },
  offResult() {
    listener = null;
    pendingResult = null;
  },
  emit(result: ScanResult) {
    if (listener) {
      listener(result);
    } else {
      // Store until the listener registers (screen focus hasn't fired yet)
      pendingResult = result;
    }
  },
};
