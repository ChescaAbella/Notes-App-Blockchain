import { useState, useMemo } from 'react';
import { Blockfrost } from "@blaze-cardano/sdk";
import { BlockchainContext } from './blockchainContext';

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