import { useState, useEffect, useCallback } from 'react';

export function useNetworkRetry(retryInterval = 3000, maxRetries = 5) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);

  const checkNetwork = useCallback(() => {
    if (navigator.onLine) {
      setIsOnline(true);
      setRetryCount(0);
    } else {
      setRetryCount((prev) => prev + 1);
    }
  }, []);

  useEffect(() => {
    if (isOnline || retryCount >= maxRetries) {
      return;
    }

    const interval = setInterval(() => {
      checkNetwork();
    }, retryInterval);

    return () => clearInterval(interval);
  }, [isOnline, retryCount, checkNetwork, retryInterval, maxRetries]);

  return { isOnline, retryCount };
}
