import React from "react";

const Demo = () => {
  return (
    <section className="demo" id="demo">
      <div className="container">
        <h2>See NoteApp in action</h2>
        <div className="demo-container">
          <div className="demo-header">
            <div className="demo-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span style={{ marginLeft: "1rem", color: "#64748b", fontSize: "0.9rem" }}>
              NoteApp Dashboard
            </span>
          </div>
          <div className="demo-content">
            <div className="demo-sidebar">
              <div className="demo-category">📚 Work</div>
              <div className="demo-category">💡 Ideas</div>
              <div className="demo-category">📝 Personal</div>
            </div>
            <div className="demo-main">
              <div className="demo-note">
                <strong>Meeting Notes - Project Alpha</strong>
                <br />
                <small style={{ color: "#6b7280" }}>Today, 2:30 PM</small>
                <br />
                Discussed timeline and key milestones...
              </div>
              <div className="demo-note">
                <strong>Weekend Trip Ideas</strong>
                <br />
                <small style={{ color: "#6b7280" }}>Yesterday</small>
                <br />
                Research mountain hiking trails...
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Demo;
