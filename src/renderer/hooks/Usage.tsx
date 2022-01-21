import { useState, useEffect } from 'react';
import { getUsage, Usage } from '../utils/usage';

export default function useUsage() {
  const [rawUsage, setRawUsage] = useState<Usage | 'loading' | 'error'>(
    'loading'
  );

  async function updateUsage() {
    setRawUsage('loading');
    try {
      const usage = await getUsage();
      setRawUsage(usage);
    } catch (err) {
      console.error(err);
      setRawUsage('error');
    }
  }

  useEffect(() => {
    updateUsage();
  }, []);
  return rawUsage;
}
