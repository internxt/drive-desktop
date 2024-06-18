import { useEffect, useState } from 'react';

import { BackupInfo } from '../../backups/BackupInfo';

export function useBackups() {
  const [backups, setBackups] = useState<
    | { status: 'LOADING' | 'ERROR' }
    | { status: 'SUCCESS'; backups: BackupInfo[] }
  >({ status: 'LOADING' });

  function fetchBackups() {
    setBackups({ status: 'LOADING' });
    window.electron
      .getBackups()
      .then((backups) => {
        setBackups({ status: 'SUCCESS', backups });
      })
      .catch(() => {
        setBackups({ status: 'ERROR' });
      });
  }

  async function addBackup() {
    setBackups({ status: 'LOADING' });
    try {
      await window.electron.addBackup();
      fetchBackups();
    } catch {
      setBackups({ status: 'ERROR' });
    }
  }

  async function disableBackup(backup: BackupInfo) {
    setBackups({ status: 'LOADING' });
    try {
      await window.electron.disableBackup(backup);
      fetchBackups();
    } catch (err) {
      console.log(err);
      setBackups({ status: 'ERROR' });
    }
  }

  async function deleteBackup(backup: BackupInfo) {
    setBackups({ status: 'LOADING' });
    try {
      await window.electron.deleteBackup(backup);
      fetchBackups();
    } catch (err) {
      console.log(err);
      setBackups({ status: 'ERROR' });
    }
  }

  useEffect(fetchBackups, []);

  return {
    backups,
    reloadBackups: fetchBackups,
    addBackup,
    disableBackup,
    deleteBackup,
  };
}
