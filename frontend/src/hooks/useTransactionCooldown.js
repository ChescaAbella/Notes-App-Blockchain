import { useState, useEffect } from 'react';

const COOLDOWN_MS = 90_000; // 90 seconds

export function useTransactionCooldown() {
  const [lastTxTime, setLastTxTime] = useState(null);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState(0);

  const isInCooldown = lastTxTime && Date.now() - lastTxTime < COOLDOWN_MS;

  // Cooldown countdown effect
  useEffect(() => {
    if (!lastTxTime) return;

    const interval = setInterval(() => {
      const remaining = COOLDOWN_MS - (Date.now() - lastTxTime);

      if (remaining <= 0) {
        setCooldownTimeLeft(0);
        clearInterval(interval);
      } else {
        setCooldownTimeLeft(Math.ceil(remaining / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastTxTime]);

  const startCooldown = () => {
    setLastTxTime(Date.now());
  };

  const checkCooldown = () => {
    const now = Date.now();
    if (lastTxTime && now - lastTxTime < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastTxTime)) / 1000);
      throw new Error(`Please wait ${remaining}s before adding another note`);
    }
  };

  return {
    isInCooldown,
    cooldownTimeLeft,
    startCooldown,
    checkCooldown,
    COOLDOWN_MS
  };
}