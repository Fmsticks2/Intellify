interface EthereumProvider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
    localStorage: Storage;
    location: Location;
  }

  const window: Window & typeof globalThis;
  const localStorage: Storage;
  const navigator: Navigator;
  
  function confirm(message?: string): boolean;
}

export {};