import { useEffect, useState } from 'react';
export function useBackupProgress() {
  const [percentualProgress, setPercentualProgress] = useState<number>(0);

  useEffect(() => {
    const removeListener = window.electron.onBackupProgress(setPercentualProgress);
    return removeListener;
  }, []);

  function clearProgress() {
    setPercentualProgress(0);
  }

  return { percentualProgress, clearProgress };
}
