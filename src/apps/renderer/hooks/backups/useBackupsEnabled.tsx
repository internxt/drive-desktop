import { useEffect, useState } from 'react';

export function useBackupsEnabled() {
  const [enabled, setEnabled] = useState(false);

  function refreshBackupsEnabled() {
    window.electron.getBackupsEnabled().then(setEnabled);
  }

  async function toggleEnabled() {
    await window.electron.toggleBackupsEnabled();
    refreshBackupsEnabled();
  }

  useEffect(() => {
    refreshBackupsEnabled();
  }, []);

  return { enabled, toggleEnabled };
}
