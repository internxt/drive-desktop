import { useContext, useEffect, useState } from 'react';
import { BackupInfo } from '../../../backups/BackupInfo';
import { DeviceContext } from '../../context/DeviceContext';
import { Device } from '../../../main/device/service';

export type BackupsState = 'LOADING' | 'ERROR' | 'SUCCESS';

export interface BackupContextProps {
  state: BackupsState;
  backups: BackupInfo[];
  disableBackup: (backup: BackupInfo) => Promise<void>;
  addBackup: () => Promise<void>;
  deleteBackups: (device: Device, isCurrent?: boolean) => Promise<void>;
}

export function useBackups(): BackupContextProps {
  const { selected, current } = useContext(DeviceContext);
  const [state, setState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);

  async function fetchBackups(): Promise<void> {
    if (!selected) return;
    const backups = await window.electron.getBackupsFromDevice(selected, selected === current);
    setBackups(backups);
  }

  async function loadBackups() {
    setState('LOADING');
    setBackups([]);

    try {
      await fetchBackups();
      setState('SUCCESS');
    } catch {
      setState('ERROR');
      setBackups([]);
    }
  }

  useEffect(() => {
    loadBackups();
  }, []);

  useEffect(() => {
    loadBackups();
  }, [selected]);

  async function addBackup(): Promise<void> {
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

  async function deleteBackups(device: Device, isCurrent?: boolean) {
    setState('LOADING');
    try {
      await window.electron.deleteBackupsFromDevice(device, isCurrent);
      await fetchBackups();
    } catch (err) {
      console.log(err);
      setState('ERROR');
    }
  }

  return { state, backups, disableBackup, addBackup, deleteBackups };
}
