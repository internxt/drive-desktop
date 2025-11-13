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
  deleteBackups: (device: Device, isCurrent?: boolean) => Promise<boolean>;
  downloadBackups: (device: Device) => Promise<void>;
  abortDownloadBackups: (device: Device) => void;
  hasExistingBackups: boolean;
}

export function useBackups(): BackupContextProps {
  const { selected, current, devices } = useContext(DeviceContext);
  const [backupsState, setBackupsState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);
  const [hasExistingBackups, setHasExistingBackups] = useState(false);

  async function fetchBackups(): Promise<void> {
    if (!selected) return;
    const backups = await window.electron.getBackupsFromDevice(selected, selected === current);
    setBackups(backups);
  }

  const validateIfBackupExists = async () => {
    const existsBackup = devices.some((device) => device.hasBackups);
    setHasExistingBackups(existsBackup);
  };

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
    validateIfBackupExists();
    loadBackups();
  }, [selected, devices]);

  async function addBackup() {
    const newBackup = await window.electron.addBackup();
    if (!newBackup) return;

    setBackups(prevBackups => {
      const existingIndex = prevBackups.findIndex(
        backup => backup.folderId === newBackup.folderId
      );

      if (existingIndex === -1) {
        return [...prevBackups, newBackup];
      }

      const updatedBackups = [...prevBackups];
      updatedBackups[existingIndex] = newBackup;
      return updatedBackups;
    });
  }

  async function disableBackup(backup: BackupInfo) {
    await window.electron.disableBackup(backup);
    await loadBackups();
  }

  async function deleteBackups(device: Device, isCurrent?: boolean): Promise<boolean> {
    setBackupsState('LOADING');
    try {
      await window.electron.deleteBackupsFromDevice(device, isCurrent);
      await fetchBackups();
      setBackupsState('SUCCESS');
      return true;
    } catch (err) {
      window.electron.logger.error({ tag: 'BACKUPS', msg: 'Error deleting backups from device', error: err });
      setBackupsState('ERROR');
      return false;
    }
  }

  async function downloadBackups(device: Device) {
    try {
      await window.electron.downloadBackup(device);
    } catch (error) {
      reportError(error);
    }
  }

  function abortDownloadBackups(device: Device) {
    return window.electron.abortDownloadBackups(device.uuid);
  }

  return {
    backupsState,
    backups,
    disableBackup,
    addBackup,
    deleteBackups,
    downloadBackups,
    abortDownloadBackups,
    hasExistingBackups,
  };
}
