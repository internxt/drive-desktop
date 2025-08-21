import { useEffect, useState } from 'react';
import { Usage } from '../../../backend/features/usage/usage.types';

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
      const getUsageResult = await window.electron.getUsage();
      console.log('getUsageResult', getUsageResult);
      if (getUsageResult.data) {
        setUsage(getUsageResult.data);
        setStatus('ready');
      } else {
        setStatus('error');
      }
    } catch (err) {
      window.electron.logger.error({
        msg: 'Error getting usage on useUsage',
        error: err,
      });
      setStatus('error');
    }
  }

  useEffect(() => {
    setStatus('loading');
    updateUsage();
    const listener = window.electron.onRemoteChanges(updateUsage);
    return listener;
  }, []);

  return {
    usage,
    refreshUsage: updateUsage,
    status,
  };
}
