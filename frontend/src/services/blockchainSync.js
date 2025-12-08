const BLOCKFROST_PROJECT_ID = import.meta.env.VITE_BLOCKFROST_PROJECT_ID;
const BLOCKFROST_API_URL = 'https://cardano-preview.blockfrost.io/api/v0';
const METADATA_LABEL = '42819'; // Your app's metadata label

/**
 * Reconstruct text from chunked metadata
 * @param {*} metadatum - Can be string or array of chunks
 * @returns {string} - Reconstructed text
 */
function reconstructText(metadatum) {
    if (typeof metadatum === 'string') {
        return metadatum;
    }

    if (Array.isArray(metadatum)) {
        return metadatum.join('');
    }

    return '';
}

/**
 * Fetch all transactions for a wallet address
 * @param {string} walletAddress - Bech32 wallet address
 * @returns {Promise<Array>} - Array of transaction hashes
 */
async function fetchWalletTransactions(walletAddress) {
    try {
        let allTxs = [];
        let page = 1;
        let hasMore = true;

        // Blockfrost paginates results (max 100 per page)
        while (hasMore) {
            const response = await fetch(
                `${BLOCKFROST_API_URL}/addresses/${walletAddress}/transactions?page=${page}&count=100&order=desc`,
                {
                    headers: {
                        'project_id': BLOCKFROST_PROJECT_ID
                    }
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    // No transactions found
                    return [];
                }
                throw new Error(`Failed to fetch transactions: ${response.status}`);
            }

            const txs = await response.json();

            if (txs.length === 0) {
                hasMore = false;
            } else {
                allTxs = allTxs.concat(txs);
                page++;

                // Stop if less than 100 results (last page)
                if (txs.length < 100) {
                    hasMore = false;
                }
            }
        }

        return allTxs;
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        throw error;
    }
}

/**
 * Fetch metadata for a specific transaction
 * @param {string} txHash - Transaction hash
 * @returns {Promise<Object|null>} - Metadata object or null
 */
async function fetchTransactionMetadata(txHash) {
    try {
        const response = await fetch(
            `${BLOCKFROST_API_URL}/txs/${txHash}/metadata`,
            {
                headers: {
                    'project_id': BLOCKFROST_PROJECT_ID
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                // No metadata for this transaction
                return null;
            }
            throw new Error(`Failed to fetch metadata: ${response.status}`);
        }

        const metadata = await response.json();

        // Find our app's metadata label
        const appMetadata = metadata.find(m => m.label === METADATA_LABEL);

        return appMetadata ? appMetadata.json_metadata : null;
    } catch (error) {
        console.error(`Error fetching metadata for tx ${txHash}:`, error);
        return null;
    }
}

/**
 * Parse note from blockchain metadata
 * @param {Object} metadata - Metadata object from blockchain
 * @param {string} txHash - Transaction hash
 * @returns {Object} - Parsed note
 */
function parseNoteFromMetadata(metadata, txHash) {
    if (!metadata) return null;

    try {
        const action = metadata.action || 'create';
        const title = reconstructText(metadata.title || '');
        const content = reconstructText(metadata.content || '');
        const timestamp = metadata.created_at || new Date().toISOString();
        const noteId = metadata.note_id || null;

        return {
            action,
            title,
            content,
            txHash,
            timestamp,
            noteId
        };
    } catch (error) {
        console.error('Error parsing note metadata:', error);
        return null;
    }
}

/**
 * Recover all notes from blockchain for a wallet address
 * @param {string} walletAddress - Bech32 wallet address
 * @param {Function} onProgress - Callback for progress updates (current, total)
 * @returns {Promise<Object>} - Recovery statistics and notes
 */
export async function recoverNotesFromBlockchain(walletAddress, onProgress = null) {
    console.log('Starting blockchain recovery for:', walletAddress);

    try {
        // Step 1: Fetch all transactions
        const transactions = await fetchWalletTransactions(walletAddress);
        console.log(`Found ${transactions.length} transactions`);

        if (transactions.length === 0) {
            return {
                success: true,
                notesRecovered: 0,
                notes: [],
                message: 'No transactions found for this wallet'
            };
        }

        // Step 2: Process each transaction to extract notes
        const recoveredNotes = [];
        let processedCount = 0;

        for (const tx of transactions) {
            processedCount++;

            // Update progress
            if (onProgress) {
                onProgress(processedCount, transactions.length);
            }

            // Fetch metadata for this transaction
            const metadata = await fetchTransactionMetadata(tx.tx_hash);

            if (metadata) {
                const note = parseNoteFromMetadata(metadata, tx.tx_hash);

                if (note) {
                    recoveredNotes.push(note);
                }
            }

            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Step 3: Deduplicate notes (keep latest version of each note)
        const deduplicatedNotes = deduplicateNotes(recoveredNotes);

        console.log(`Recovery complete: ${deduplicatedNotes.length} notes recovered`);

        return {
            success: true,
            notesRecovered: deduplicatedNotes.length,
            notes: deduplicatedNotes,
            message: `Successfully recovered ${deduplicatedNotes.length} notes from blockchain`
        };

    } catch (error) {
        console.error('Blockchain recovery failed:', error);
        return {
            success: false,
            notesRecovered: 0,
            notes: [],
            message: `Recovery failed: ${error.message}`
        };
    }
}

/**
 * Deduplicate notes - keep only the latest version of each note
 * @param {Array} notes - Array of notes
 * @returns {Array} - Deduplicated notes
 */
function deduplicateNotes(notes) {
    const noteMap = new Map();

    // Sort by timestamp (oldest first)
    const sortedNotes = [...notes].sort((a, b) =>
        new Date(a.timestamp) - new Date(b.timestamp)
    );

    for (const note of sortedNotes) {
        const key = note.noteId || note.txHash;

        if (note.action === 'delete') {
            // If this is a delete action, mark the note as deleted
            noteMap.set(key, { ...note, isDeleted: true });
        } else {
            // For create/update, only add if not already deleted
            const existing = noteMap.get(key);
            if (!existing || !existing.isDeleted) {
                noteMap.set(key, note);
            }
            // If already deleted, don't resurrect it!
        }
    }

    // Filter out deleted notes before returning
    return Array.from(noteMap.values()).filter(note => !note.isDeleted);
}

/**
 * Save recovered notes to database
 * @param {Array} notes - Array of recovered notes
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<Object>} - Save results
 */
export async function saveRecoveredNotesToDatabase(notes, walletAddress) {
    console.log(`Saving ${notes.length} recovered notes to database`);

    let savedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const note of notes) {
        try {
            const response = await fetch('http://localhost:4000/api/notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    wallet_address: walletAddress,
                    title: note.title,
                    content: note.content,
                    txHash: note.txHash
                })
            });

            if (response.ok) {
                savedCount++;
            } else {
                // Always count as skipped if not ok (likely duplicate)
                skippedCount++;
            }
        } catch (error) {
            errors.push(`Error saving note: ${error.message}`);
        }
    }

    return {
        savedCount,
        skippedCount,
        errors,
        message: `Saved ${savedCount} new notes, skipped ${skippedCount} existing notes`
    };
}