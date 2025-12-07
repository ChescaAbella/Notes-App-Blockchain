import { createContext, useState, useEffect, useContext } from 'react';
import { WebWallet, Core } from "@blaze-cardano/sdk";
import { Buffer } from "buffer";

// Create the context
const WalletContext = createContext(null);

// WalletProvider component
export function WalletProvider({ children }) {
  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Discover available wallets on mount
  useEffect(() => {
    if (window.cardano) {
      const availableWallets = Object.keys(window.cardano);
      console.log('Available wallets:', availableWallets);
      setWallets(availableWallets);
    }
  }, []);

  const connectWallet = async (walletName = selectedWallet) => {
    if (!walletName) {
      throw new Error("Please select a wallet first");
    }

    try {
      setIsConnecting(true);
      console.log('Connecting to wallet:', walletName);
      
      const api = await window.cardano[walletName].enable();
      setWalletApi(api);

      const hexAddress = await api.getChangeAddress();
      const bech32Address = Core.Address.fromBytes(
        Buffer.from(hexAddress, "hex")
      ).toBech32();
      
      setWalletAddress(bech32Address);
      console.log('Wallet connected successfully!');
      console.log('Wallet address:', bech32Address);

      return { api, address: bech32Address };
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    console.log('Disconnecting wallet...');
    setWalletApi(null);
    setWalletAddress(null);
    setSelectedWallet(null);
  };

  const createWebWallet = () => {
    if (!walletApi) {
      throw new Error("Wallet not connected");
    }
    return new WebWallet(walletApi);
  };

  const value = {
    wallets,
    walletApi,
    selectedWallet,
    setSelectedWallet,
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    createWebWallet,
    isConnected: !!walletApi && !!walletAddress
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Custom hook to use wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}