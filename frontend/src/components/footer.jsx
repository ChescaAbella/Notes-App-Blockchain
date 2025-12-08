import React from "react";
import "../styles/footer.css";

const Footer = () => {
  return (
    <footer>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>NoteApp</h3>
            <p>
              Decentralized note storage on Cardano blockchain. Immutable,
              permanent, and always yours.
            </p>
          </div>
          <div className="footer-section">
            <h3>Blockchain</h3>
            <ul className="footer-links">
              <li>
                <a href="#features">How It Works</a>
              </li>
              <li>
                <a
                  href="https://cardano.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Cardano Network
                </a>
              </li>
              <li>
                <a
                  href="https://www.lace.io"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Lace Wallet
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Resources</h3>
            <ul className="footer-links">
              <li>
                <a href="#demo">Demo</a>
              </li>
              <li>
                <a href="#features">Features</a>
              </li>
              <li>
                <a
                  href="https://docs.cardano.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Legal</h3>
            <ul className="footer-links">
              <li>
                <a href="#">Privacy Policy</a>
              </li>
              <li>
                <a href="#">Terms of Service</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 NoteApp. Built on Cardano blockchain.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
