import { memo } from 'react';

const RestoreConfirmModal = memo(({ show, note, onConfirm, onCancel }) => {
  if (!show || !note) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
        <div className="modal-header">
          <h2>Restore Note</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div style={{padding: '30px', paddingTop: '20px'}}>
          <p style={{marginBottom: '15px', lineHeight: '1.6', fontWeight: '500'}}>
            Restore "{note.title || 'Untitled'}"?
          </p>
          <p style={{marginBottom: '25px', lineHeight: '1.6', color: '#666'}}>
            ↩️ This will move the note back to your notes.
          </p>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn-submit"
              style={{background: '#22c55e'}}
            >
              Restore Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

RestoreConfirmModal.displayName = 'RestoreConfirmModal';

export default RestoreConfirmModal;