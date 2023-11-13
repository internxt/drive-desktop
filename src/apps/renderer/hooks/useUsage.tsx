import { Usage } from 'apps/main/usage/Usage';
import { useEffect, useState } from 'react';

export default function useUsage() {
  const [usage, setUsage] = useState<Usage>();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>(
    'loading'
  );
  async function updateUsage() {
    try {
      const userIsLoggedIn = await window.electron.isUserLoggedIn();

      if (!userIsLoggedIn) {
        return;
      }
      const usage = await window.electron.getUsage();

      setUsage(usage);
      setStatus('ready');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  useEffect(() => {
    setStatus('loading');
    updateUsage();
    const listener = window.electron.onRemoteChanges(updateUsage);
    return listener;
  }, []);

  return { usage, refreshUsage: updateUsage, status };
}
