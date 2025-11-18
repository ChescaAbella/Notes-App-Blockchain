import { useState, useEffect } from 'react';
import { WebWallet, Core } from "@blaze-cardano/sdk";
import { Buffer } from "buffer";

export function useWallet() {
  const [wallets, setWallets] = useState([]);
  const [walletApi, setWalletApi] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Discover available wallets on mount
  useEffect(() => {
    if (window.cardano) {
      setWallets(Object.keys(window.cardano));
    }
  }, []);

  const connectWallet = async (walletName = selectedWallet) => {
    if (!walletName) {
      throw new Error("Please select a wallet first");
    }

    try {
      setIsConnecting(true);
      const api = await window.cardano[walletName].enable();
      setWalletApi(api);

      const hexAddress = await api.getChangeAddress();
      const bech32Address = Core.Address.fromBytes(
        Buffer.from(hexAddress, "hex")
      ).toBech32();
      setWalletAddress(bech32Address);

      return { api, address: bech32Address };
    } catch (error) {
      console.error("Wallet connection failed:", error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
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

  return {
    wallets,
    walletApi,
    selectedWallet,
    setSelectedWallet,
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    createWebWallet,
    isConnected: !!walletApi
  };
}