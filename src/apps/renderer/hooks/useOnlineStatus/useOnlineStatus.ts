import { useEffect, useState } from 'react';

/** Default is 5 minutes that is equal to 300000 ms  */
const DEFAULT_INTERVAL = 300000;

export const useOnlineStatus = (INTERVAL = DEFAULT_INTERVAL) => {
  const [online, setOnline] = useState(true);

  async function checkInternetConnection(): Promise<boolean> {
    try {
      return await window.electron.checkInternetConnection();
    } catch {
      return navigator.onLine;
    }
  }

  useEffect(() => {
    const updateOnlineStatus = async () => {
      const onlineStatus = await checkInternetConnection();
      setOnline(onlineStatus);
    };

    void updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    const statusInterval = setInterval(updateOnlineStatus, INTERVAL);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(statusInterval);
    };
  }, []);

  return online;
};
