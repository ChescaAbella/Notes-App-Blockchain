const BLOCKFROST_PROJECT_ID = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
const BLOCKFROST_API_URL = 'https://cardano-preview.blockfrost.io/api/v0';

/**
 * Check if a transaction has been confirmed on the blockchain
 * @param {string} txHash - Transaction hash to check
 * @returns {Promise<boolean>} - True if confirmed, false if still pending
 */
export async function isTransactionConfirmed(txHash) {
    if (!txHash) return false;

    try {
        const response = await fetch(`${BLOCKFROST_API_URL}/txs/${txHash}`, {
            headers: {
                'project_id': BLOCKFROST_PROJECT_ID
            }
        });

        if (response.ok) {
            const data = await response.json();
            // If we can fetch the transaction and it has a block, it's confirmed
            return !!data.block;
        }

        // If 404 or other error, transaction not found yet (still pending)
        return false;
    } catch (error) {
        console.error('Error checking transaction status:', error);
        return false;
    }
}

/**
 * Monitor multiple transactions and update their statuses
 * @param {Array} notes - Array of notes with txHash and status
 * @param {Function} onStatusUpdate - Callback when a status changes (noteId, newStatus)
 */
export async function monitorTransactions(notes, onStatusUpdate) {
    // Query all notes with status = 'pending'
    const pendingNotes = notes.filter(note =>
        note.status === 'pending' && (note.txHash || note.last_edit_tx_hash || note.deletion_tx_hash)
    );

    // For each pending note, check its transaction hash
    for (const note of pendingNotes) {
        const txHash = note.txHash || note.last_edit_tx_hash || note.deletion_tx_hash;

        try {
            const isConfirmed = await isTransactionConfirmed(txHash);

            // If Blockfrost returns 200 OK with block data, update to 'confirmed'
            if (isConfirmed) {
                onStatusUpdate(note.id, 'confirmed');
            }
            // If 404 or not confirmed, do nothing and check again in next interval
        } catch (error) {
            console.error(`Error monitoring transaction for note ${note.id}:`, error);
        }
    }
}

/**
 * Start periodic monitoring of pending transactions
 * Checks every 20 seconds for confirmation (as per professor's requirement)
 * @param {Array} notes - Array of notes to monitor
 * @param {Function} onStatusUpdate - Callback when a status changes
 * @returns {Function} - Cleanup function to stop monitoring
 */
export function startTransactionMonitoring(notes, onStatusUpdate) {
    // Initial check
    monitorTransactions(notes, onStatusUpdate);

    // Check every 20 seconds
    const intervalId = setInterval(() => {
        monitorTransactions(notes, onStatusUpdate);
    }, 20000);

    // Return cleanup function
    return () => clearInterval(intervalId);
}