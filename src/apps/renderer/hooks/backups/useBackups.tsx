import { useContext, useEffect, useState } from 'react';
import { BackupInfo } from '../../../backups/BackupInfo';
import { ActualDeviceContext } from '../../context/ActualDeviceContext';

export type BackupsState = 'LOADING' | 'ERROR' | 'SUCCESS';

export interface BackupContextProps {
  state: BackupsState;
  backups: BackupInfo[];
  disableBackup: (backup: BackupInfo) => Promise<void>;
  addBackup: () => Promise<void>;
  deleteBackup: (backup: BackupInfo) => Promise<void>;
}

export function useBackups() {
  const { selected } = useContext(ActualDeviceContext);
  const [state, setState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);

  async function fetchBackups(): Promise<void> {
    const backups = await window.electron.getBackups(selected);
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

  useEffect(() => {
    loadBackups();
  }, [selected]);

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
    await loadBackups();
  }

  async function deleteBackup(backup: BackupInfo) {
    setState('LOADING');
    try {
      await window.electron.deleteBackup(backup);
      await fetchBackups();
    } catch (err) {
      console.log(err);
      setState('ERROR');
    }
  }

  return { state, backups, disableBackup, addBackup, deleteBackup };
}
