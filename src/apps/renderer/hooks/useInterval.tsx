import { useEffect, useState } from 'react';

export function useInterval(callback: () => void, interval: number) {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const intervalCallback = () => {
      callback();
    };

    const id = setInterval(intervalCallback, interval);
    setIntervalId(id);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);
  return intervalId;
}
