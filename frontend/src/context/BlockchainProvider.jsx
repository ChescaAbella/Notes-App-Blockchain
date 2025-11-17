import { createContext, useContext, useState, useMemo } from 'react';
import { Blockfrost } from "@blaze-cardano/sdk";

const BlockchainContext = createContext(null);

export function BlockchainProvider({ children }) {
  const [provider] = useState(
    () =>
      new Blockfrost({
        network: "cardano-preview",
        projectId: import.meta.env.VITE_BLOCKFROST_PROJECT_ID,
      })
  );

  const value = useMemo(() => ({ provider }), [provider]);

  return (
    <BlockchainContext.Provider value={value}>
      {children}
    </BlockchainContext.Provider>
  );
}

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
}