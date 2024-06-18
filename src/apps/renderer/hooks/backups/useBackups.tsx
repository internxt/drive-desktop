import { useEffect, useState } from 'react';
import { BackupInfo } from '../../../backups/BackupInfo';

export type BackupsState = 'LOADING' | 'ERROR' | 'SUCCESS';

export function useBackups() {
  const [state, setState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);

  async function fetchBackups(): Promise<void> {
    const backups = await window.electron.getBackups();

    setBackups(backups);
  }

  async function loadBackups() {
    setState('LOADING');

    try {
      await fetchBackups();
      setState('SUCCESS');
    } catch {
      setState('ERROR');
    }
  }

  useEffect(() => {
    loadBackups();
  }, []);

  async function addBackup() {
    try {
      await window.electron.addBackup();
      await loadBackups();
    } catch {
      setState('ERROR');
    }
  }

  async function disableBackup(backup: BackupInfo) {
    await window.electron.disableBackup(backup);
    loadBackups();
  }

  async function deleteBackup(backup: BackupInfo) {
    setState('LOADING');
    try {
      await window.electron.deleteBackup(backup);
      fetchBackups();
    } catch (err) {
      console.log(err);
      setState('ERROR');
    }
  }

  return { state, backups, disableBackup, addBackup, deleteBackup };
}
