import React, { useEffect } from "react";
import { Shield, Link2, Database, Zap } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Immutable & Secure",
    desc: "Notes are permanently stored on Cardano blockchain. Once written, they cannot be altered or deleted by anyone.",
  },
  {
    icon: Link2,
    title: "Decentralized Storage",
    desc: "No central server, no single point of failure. Your notes exist on a distributed network of nodes worldwide.",
  },
  {
    icon: Database,
    title: "On-Chain Metadata",
    desc: "Every note is a blockchain transaction with metadata. View transaction hashes and verify authenticity on-chain.",
  },
];

const Features = () => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    document.querySelectorAll(".feature-card").forEach((card) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      observer.observe(card);
    });
  }, []);

  return (
    <section className="features" id="features">
      <div className="container">
        <h2>Everything you need to stay organized</h2>
        <div className="features-grid">
          {features.map((f, i) => {
            const IconComponent = f.icon;
            return (
              <div className="feature-card" key={i}>
                <div className="feature-icon">
                  <IconComponent size={28} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
