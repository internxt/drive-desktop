import { useEffect, useState } from 'react';

export function useDiscoverBackups() {
  const [hasDiscovered, setHasDiscovered] = useState(true);

  function refresh() {
    window.electron.user.hasDiscoveredBackups().then(setHasDiscovered);
  }

  async function discover() {
    await window.electron.user.discoveredBackups();
    refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return { hasDiscovered, discover };
}
