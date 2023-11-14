import { useEffect, useState } from 'react';

import { Backup } from '../../main/device/service';

export function useBackups() {
  const [backups, setBackups] = useState<
    { status: 'LOADING' | 'ERROR' } | { status: 'SUCCESS'; backups: Backup[] }
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

  async function disableBackup(backup: Backup) {
    setBackups({ status: 'LOADING' });
    try {
      await window.electron.disableBackup(backup);
      fetchBackups();
    } catch (err) {
      console.log(err);
      setBackups({ status: 'ERROR' });
    }
  }

  async function deleteBackup(backup: Backup) {
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
