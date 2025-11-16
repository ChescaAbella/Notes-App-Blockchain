export default function SuccessMessage({ message, onClose, className = "" }) {
  return (
    <div className={`success-message ${className}`}>
      <div className="success-content">
        <span className="success-icon">✓</span>
        <span className="success-text">{message}</span>
        {onClose && (
          <button 
            className="close-button"
            onClick={onClose}
            aria-label="Close success message"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}