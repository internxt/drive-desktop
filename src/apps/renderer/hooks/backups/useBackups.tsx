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
  downloadBackups: (device: Device, foldersId?: number[]) => Promise<void>;
  abortDownloadBackups: (device: Device) => void;
  refreshBackups: () => Promise<void>;
}

export function useBackups(): BackupContextProps {
  const { selected, current } = useContext(DeviceContext);
  const [backupsState, setBackupsState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);

  async function fetchBackups(): Promise<void> {
    let backups: BackupInfo[];

    if (!selected) {
      if (!current) return;

      backups = await window.electron.getBackupsFromDevice(current, true);
    } else {
      backups = await window.electron.getBackupsFromDevice(selected, selected.id === current?.id);
    }
    window.electron.logger.info('Backups fetched', backups.length);
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
  }, [selected]);

  useEffect(() => {
    const removeListener = window.electron.listenersRefreshBackups(fetchBackups, 'refresh-backup');

    return removeListener;
  }, []);

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
      setBackupsState('ERROR');
    }
  }

  async function downloadBackups(device: Device, foldersId?: number[]) {
    try {
      await window.electron.downloadBackup(device, foldersId);
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
    refreshBackups: fetchBackups,
    disableBackup,
    addBackup,
    deleteBackups,
    downloadBackups,
    abortDownloadBackups,
  };
}
