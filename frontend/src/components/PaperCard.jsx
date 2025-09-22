export default function PaperCard({ 
  children, 
  className = "", 
  showLines = true, 
  rotation = -2,
  animate = false 
}) {
  const cardClass = `paper-card ${animate ? 'animate' : ''} ${className}`;
  const style = { transform: `rotate(${rotation}deg)` };

  return (
    <div className={cardClass} style={style}>
      {children}
      {showLines && (
        <div className="paper-lines-container">
          <div className="paper-lines"></div>
          <div className="paper-lines"></div>
          <div className="paper-lines"></div>
        </div>
      )}
    </div>
  );
}