import { memo } from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const SyncModal = memo(({
    show,
    isLoading,
    progress,
    result,
    onClose,
    onConfirm
}) => {
    if (!show) return null;

    return (
        <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px' }}
            >
                <div className="modal-header">
                    <h2>Sync from Blockchain</h2>
                    {!isLoading && <button className="modal-close" onClick={onClose}>×</button>}
                </div>

                <div style={{ padding: '30px', paddingTop: '20px' }}>
                    {!isLoading && !result && (
                        <>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                color: 'var(--accent-cyan)'
                            }}>
                                <RefreshCw size={48} strokeWidth={1.5} />
                            </div>
                            <p style={{ marginBottom: '15px', lineHeight: '1.6' }}>
                                This will scan the Cardano blockchain for all notes created with this wallet address
                                and sync them to your local database.
                            </p>
                            <p style={{ marginBottom: '25px', lineHeight: '1.6', color: '#94a3b8', fontSize: '0.9rem' }}>
                                ⚠️ This may take a few moments depending on your transaction history.
                            </p>
                            <div className="modal-actions">
                                <button type="button" onClick={onClose} className="btn-cancel">
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={onConfirm}
                                    className="btn-submit"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-teal) 100%)'
                                    }}
                                >
                                    <RefreshCw size={16} />
                                    Start Sync
                                </button>
                            </div>
                        </>
                    )}

                    {isLoading && (
                        <>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px'
                            }}>
                                <div className="sync-spinner">
                                    <RefreshCw size={48} strokeWidth={1.5} style={{
                                        color: 'var(--accent-cyan)',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                </div>
                            </div>
                            <p style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: 'var(--text-light)'
                            }}>
                                Syncing from blockchain...
                            </p>
                            {progress && (
                                <div>
                                    <div style={{
                                        background: 'var(--bg-dark)',
                                        borderRadius: '10px',
                                        height: '8px',
                                        overflow: 'hidden',
                                        marginBottom: '10px'
                                    }}>
                                        <div style={{
                                            background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-teal) 100%)',
                                            height: '100%',
                                            width: `${(progress.current / progress.total) * 100}%`,
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                    <p style={{
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        color: 'var(--text-muted)'
                                    }}>
                                        Processing transaction {progress.current} of {progress.total}
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    {result && (
                        <>
                            <div style={{
                                textAlign: 'center',
                                marginBottom: '20px',
                                color: result.success ? 'var(--success)' : '#ef4444'
                            }}>
                                {result.success ? (
                                    <CheckCircle size={48} strokeWidth={1.5} />
                                ) : (
                                    <XCircle size={48} strokeWidth={1.5} />
                                )}
                            </div>
                            <p style={{
                                textAlign: 'center',
                                marginBottom: '15px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                color: 'var(--text-light)'
                            }}>
                                {result.success ? 'Sync Complete!' : 'Sync Failed'}
                            </p>
                            <p style={{
                                textAlign: 'center',
                                marginBottom: '25px',
                                lineHeight: '1.6',
                                color: 'var(--text-muted)'
                            }}>
                                {result.message}
                            </p>
                            {result.saveResult && (
                                <div style={{
                                    background: 'var(--bg-dark)',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    marginBottom: '20px',
                                    fontSize: '0.9rem',
                                    color: 'var(--text-muted)'
                                }}>
                                    <div style={{ marginBottom: '8px' }}>
                                        ✅ New notes saved: <strong style={{ color: 'var(--text-light)' }}>{result.saveResult.savedCount}</strong>
                                    </div>
                                    <div>
                                        ⏭️ Existing notes skipped: <strong style={{ color: 'var(--text-light)' }}>{result.saveResult.skippedCount}</strong>
                                    </div>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-submit"
                                    style={{
                                        width: '100%',
                                        background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-teal) 100%)'
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

SyncModal.displayName = 'SyncModal';

export default SyncModal;