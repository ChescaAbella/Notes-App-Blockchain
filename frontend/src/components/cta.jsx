import React from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "../hooks/useWallet";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleCTA = () => {
    if (isConnected) {
      navigate("/home");
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <section className="cta">
      <div className="container">
        <h2>Ready to secure your notes on-chain?</h2>
        <p>
          Join the decentralized future of note-taking on Cardano blockchain
        </p>
        <button onClick={handleCTA} className="cta-button">
          {isConnected ? "Go to My Notes" : "Connect Wallet to Start"}
          <ArrowRight size={20} />
        </button>
      </div>
    </section>
  );
};

export default CTA;
