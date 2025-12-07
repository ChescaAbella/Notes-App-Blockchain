import { memo } from 'react';

const ConfirmModal = memo(({ show, isLoading, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
        <div className="modal-header">
          <h2>Confirm Changes</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div style={{padding: '30px', paddingTop: '20px'}}>
          <p style={{marginBottom: '25px', lineHeight: '1.6'}}>
            This will create a new transaction on the blockchain with the updated content.
            The original note remains immutably stored on-chain.
          </p>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button type="button" onClick={onConfirm} className="btn-submit" disabled={isLoading}>
              Confirm & Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ConfirmModal.displayName = 'ConfirmModal';

export default ConfirmModal;