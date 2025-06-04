import { useEffect, useState, useCallback } from 'react';
import { Usage } from '../../main/usage/Usage';
import lodashDebounce from 'lodash.debounce';

export default function useUsage() {
  const [usage, setUsage] = useState<Usage>();
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  const updateUsage = useCallback(async () => {
    try {
      const userIsLoggedIn = await window.electron.isUserLoggedIn();

      if (!userIsLoggedIn) {
        return;
      }
      const usage = await window.electron.getUsage();

      setUsage(usage);
      setStatus('ready');
    } catch (err) {
      setStatus('error');
    }
  }, []);

  const debouncedUpdateUsage = useCallback(lodashDebounce(updateUsage, 500), []);

  useEffect(() => {
    setStatus('loading');
    void debouncedUpdateUsage();
    const listener = window.electron.onRemoteChanges(debouncedUpdateUsage);
    return listener;
  }, [updateUsage, debouncedUpdateUsage]);

  return { usage, refreshUsage: debouncedUpdateUsage, status };
}
