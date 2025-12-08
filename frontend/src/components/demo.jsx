import React from "react";
import {
  CheckCircle,
  Clock,
  Hash,
  Briefcase,
  Lightbulb,
  User,
} from "lucide-react";
const Demo = () => {
  return (
    <section className="demo" id="demo">
      <div className="container">
        <h2>See blockchain notes in action</h2>
        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span
              style={{
                marginLeft: "1rem",
                color: "#94a3b8",
                fontSize: "0.9rem",
              }}
            >
              NoteApp Dashboard - Cardano Preview Network
            </span>
          </div>
          <div className="demo-content">
            <div className="demo-sidebar">
              <div className="demo-category">
                <Briefcase size={16} />
                <span>Work</span>
              </div>
              <div className="demo-category">
                <Lightbulb size={16} />
                <span>Ideas</span>
              </div>
              <div className="demo-category">
                <User size={16} />
                <span>Personal</span>
              </div>
            </div>
            <div className="demo-main">
              <div className="demo-note">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <CheckCircle size={16} color="#10b981" />
                  <strong>Meeting Notes - Project Alpha</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Hash size={14} />
                  <span>TX: a3f7d2...8e4b</span>
                  <Clock size={14} style={{ marginLeft: "0.5rem" }} />
                  <span>2 blocks confirmed</span>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                  Discussed timeline and key milestones for Q1 delivery...
                </p>
              </div>
              <div className="demo-note">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.5rem",
                  }}
                >
                  <CheckCircle size={16} color="#10b981" />
                  <strong>Blockchain Research Notes</strong>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.85rem",
                    color: "#94a3b8",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Hash size={14} />
                  <span>TX: 9c2e1f...3a7d</span>
                  <Clock size={14} style={{ marginLeft: "0.5rem" }} />
                  <span>5 blocks confirmed</span>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "0.95rem" }}>
                  Exploring Cardano smart contracts and metadata storage...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;
