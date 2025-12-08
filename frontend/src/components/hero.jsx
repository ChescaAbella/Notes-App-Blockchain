import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { ArrowRight, Shield } from "lucide-react";

const Hero = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate("/home");
    } else {
      // Scroll to features or show a message to connect wallet
      document
        .querySelector("#features")
        ?.scrollIntoView({ behavior: "smooth" });
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
              <div className="stat-icon-wrapper">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  <path d="M2 12h20" />
                </svg>
              </div>
              <div className="stat-value">100%</div>
              <div className="stat-label">Decentralized</div>
            </div>
            <div className="stat">
              <div className="stat-icon-wrapper">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="stat-value">∞</div>
              <div className="stat-label">Permanent Storage</div>
            </div>
            <div className="stat">
              <div className="stat-icon-wrapper">
                <Shield size={32} />
              </div>
              <div className="stat-value">100%</div>
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
