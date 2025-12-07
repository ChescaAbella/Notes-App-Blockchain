import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { ChevronDown, Copy, Check } from "lucide-react";
import { copyToClipboard } from "../utils/clipboard";
import "../styles/header.css";

const Header = () => {
  const navigate = useNavigate();
  const [addressCopied, setAddressCopied] = useState(false);
  const {
    wallets,
    selectedWallet,
    setSelectedWallet,
    walletAddress,
    isConnecting,
    connectWallet,
    isConnected
  } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      const header = document.querySelector("header");
      if (window.scrollY > 100) {
        header.style.background = "rgba(255, 255, 255, 0.98)";
        header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.1)";
      } else {
        header.style.background = "rgba(255, 255, 255, 0.95)";
        header.style.borderBottom = "1px solid rgba(0, 0, 0, 0.05)";
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWalletChange = useCallback((e) => {
    setSelectedWallet(e.target.value);
  }, [setSelectedWallet]);

  const handleConnectWallet = useCallback(async () => {
    try {
      await connectWallet();
      // Navigate to home page after successful connection
      navigate('/home');
    } catch (err) {
      console.error("Failed to connect wallet:", err);
    }
  }, [connectWallet, navigate]);

  const copyAddress = useCallback(async () => {
    if (walletAddress) {
      const success = await copyToClipboard(walletAddress);
      if (success) {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
      }
    }
  }, [walletAddress]);

  return (
    <header className="site-header">
      <nav className="container">
        <Link to="/" className="logo" aria-label="Go to homepage">
          NoteApp
        </Link>

        <ul className="nav-links">
          <li>
            <a href="#features">Features</a>
          </li>
          <li>
            <a href="#demo">Demo</a>
          </li>
          <li>
            <Link to="/about">About</Link>
          </li>
          <li>
            <Link to="/contact">Contact Us</Link>
          </li>
          {isConnected && (
            <li>
              <Link to="/home">My Notes</Link>
            </li>
          )}
        </ul>

        {!isConnected ? (
          <div className="nav-actions">
            <div className="custom-select-wrapper">
              <select
                value={selectedWallet || ""}
                onChange={handleWalletChange}
                className="wallet-select"
                disabled={isConnecting}
              >
                <option value="">Choose Wallet</option>
                {wallets.map((w) => (
                  <option key={w} value={w}>
                    {w.charAt(0).toUpperCase() + w.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown className="select-icon" size={20} />
            </div>
            <button
              onClick={handleConnectWallet}
              className="btn primary"
              disabled={isConnecting || !selectedWallet}
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          </div>
        ) : (
          <div className="nav-actions wallet-connected">
            <div className="wallet-address-display">
              <span className="wallet-label">Connected:</span>
              <span className="wallet-address-short" title={walletAddress}>
                {walletAddress ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}` : ''}
              </span>
              <button onClick={copyAddress} className="btn-copy-small">
                {addressCopied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;