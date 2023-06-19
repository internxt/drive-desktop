import { useEffect, useState } from 'react';

import { Usage } from '../../main/usage/usage';

export default function useUsage() {
  const [usage, setUsage] = useState<Usage | 'loading' | 'error'>('loading');
  const [refresh, setRefresh] = useState<number>(0);

  async function updateUsage() {
    if (!(await window.electron.isUserLoggedIn())) {
      return;
    }

    try {
      const usage = await window.electron.getUsage();
      setUsage(usage);
    } catch (err) {
      console.error(err);
      setUsage('error');
    }
  }

  useEffect(() => {
    setUsage('loading');
    updateUsage();
    const listener = window.electron.onRemoteChanges(updateUsage);
    return listener;
  }, [refresh]);

  const refreshUsage = () => {
    setRefresh(Date.now());
  };

  return { usage, refreshUsage };
}
