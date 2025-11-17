import { useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

export function useClipboardCopy(resetDelay = 2000) {
  const [isCopied, setIsCopied] = useState(false);

  const copy = async (text) => {
    if (!text) return false;

    const success = await copyToClipboard(text);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), resetDelay);
    }
    return success;
  };

  return {
    isCopied,
    copy
  };
}