import { useContext, useEffect, useState } from 'react';
import { BackupInfo } from '../../../backups/BackupInfo';
import { DeviceContext } from '../../context/DeviceContext';
import { Device } from '../../../main/device/service';

export type BackupsState = 'LOADING' | 'ERROR' | 'SUCCESS';

export interface BackupContextProps {
  backupsState: BackupsState;
  backups: BackupInfo[];
  disableBackup: (backup: BackupInfo) => Promise<void>;
  addBackup: () => Promise<void>;
  deleteBackups: (device: Device, isCurrent?: boolean) => Promise<void>;
  downloadBackups: (device: Device) => Promise<void>;
}

export function useBackups(): BackupContextProps {
  const { selected, current } = useContext(DeviceContext);
  const [backupsState, setBackupsState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);

  async function fetchBackups(): Promise<void> {
    if (!selected) return;
    const backups = await window.electron.getBackupsFromDevice(
      selected,
      selected === current
    );
    setBackups(backups);
  }

  async function loadBackups() {
    setBackupsState('LOADING');
    setBackups([]);

    try {
      await fetchBackups();
      setBackupsState('SUCCESS');
    } catch {
      setBackupsState('ERROR');
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
      setBackupsState('ERROR');
    }
  }

  async function disableBackup(backup: BackupInfo) {
    await window.electron.disableBackup(backup);
    await loadBackups();
  }

  async function deleteBackups(device: Device, isCurrent?: boolean) {
    setBackupsState('LOADING');
    try {
      await window.electron.deleteBackupsFromDevice(device, isCurrent);
      await fetchBackups();
      setBackupsState('SUCCESS');
    } catch (err) {
      console.log(err);
      setBackupsState('ERROR');
    }
  }

  async function downloadBackups(device: Device) {
    try {
      await window.electron.downloadBackup(device);
    } catch (error) {
      reportError(error);
    }
  }

  return {
    backupsState,
    backups,
    disableBackup,
    addBackup,
    deleteBackups,
    downloadBackups,
  };
}
