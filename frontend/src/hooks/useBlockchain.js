import { useContext } from 'react';
import { BlockchainContext } from '../context/blockchainContext';

export function useBlockchain() {
  const context = useContext(BlockchainContext);
  if (!context) {
    throw new Error('useBlockchain must be used within a BlockchainProvider');
  }
  return context;
}
