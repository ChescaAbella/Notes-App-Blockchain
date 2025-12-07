import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/home');
    } else {
      // Scroll to features or show a message to connect wallet
      document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero">
      <div className="container hero-container">
        <div className="hero-text">
          <h1 className="hero-title">
            Your Notes,
            <br />
            <span className="gradient-text">Secured on Blockchain</span>
          </h1>
          <p className="hero-description">
            Store your thoughts immutably on the Cardano blockchain. 
            Decentralized, permanent, and always accessible.
          </p>
          <div className="hero-buttons">
            <button className="btn primary large" onClick={handleGetStarted}>
              {isConnected ? "Go to My Notes" : "Get Started"}
              <ArrowRight size={20} />
            </button>
            <a href="#features" className="btn ghost large">
              Learn More
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-value">100%</div>
              <div className="stat-label">Decentralized</div>
            </div>
            <div className="stat">
              <div className="stat-value">∞</div>
              <div className="stat-label">Permanent Storage</div>
            </div>
            <div className="stat">
              <div className="stat-value">🔐</div>
              <div className="stat-label">Secure</div>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="blockchain-visual">
            <div className="block"></div>
            <div className="block"></div>
            <div className="block"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;