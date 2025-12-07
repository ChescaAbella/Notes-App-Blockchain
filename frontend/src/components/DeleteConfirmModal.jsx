import { memo } from 'react';

const DeleteConfirmModal = memo(({ 
  show, 
  note, 
  isLoading, 
  isInCooldown, 
  cooldownTimeLeft, 
  onConfirm, 
  onCancel 
}) => {
  if (!show || !note) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{maxWidth: '450px'}}>
        <div className="modal-header">
          <h2>Delete Note</h2>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div style={{padding: '30px', paddingTop: '20px'}}>
          <p style={{marginBottom: '15px', lineHeight: '1.6', fontWeight: '500'}}>
            Delete "{note.title || 'Untitled'}"?
          </p>
          <p style={{marginBottom: '25px', lineHeight: '1.6', color: '#666'}}>
            ⛓️ This will create a deletion transaction on the blockchain and move the note to trash.
          </p>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="btn-submit"
              style={{background: '#ef4444'}}
              disabled={isLoading || isInCooldown}
            >
              {isLoading ? "Deleting..." : isInCooldown ? `Wait ${cooldownTimeLeft}s` : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

DeleteConfirmModal.displayName = 'DeleteConfirmModal';

export default DeleteConfirmModal;