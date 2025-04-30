import { useContext, useEffect, useState } from 'react';
import { BackupInfo } from '../../../backups/BackupInfo';
import { DeviceContext } from '../../context/DeviceContext';
import { Device } from '../../../main/device/service';
import { useDevices } from '../devices/useDevices';

export type BackupsState = 'LOADING' | 'ERROR' | 'SUCCESS';

export interface BackupContextProps {
  backupsState: BackupsState;
  backups: BackupInfo[];
  disableBackup: (backup: BackupInfo) => Promise<void>;
  addBackup: () => Promise<void>;
  deleteBackups: (device: Device, isCurrent?: boolean) => Promise<void>;
  downloadBackups: (device: Device, folderUuids?: string[]) => Promise<void>;
  abortDownloadBackups: (device: Device) => void;
  refreshBackups: () => Promise<void>;
  isBackupAvailable: boolean;
  existsBackup: boolean;
}

export function useBackups(): BackupContextProps {
  const { selected, current } = useContext(DeviceContext);
  const [backupsState, setBackupsState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);
  const [isBackupAvailable, setIsBackupAvailable] = useState<boolean>(false);
  const [existsBackup, setExistsBackup] = useState<boolean>(false);

  const { devices } = useDevices();

  async function fetchBackups(): Promise<void> {
    let backups: BackupInfo[];

    if (!selected) {
      if (!current) return;

      backups = await window.electron.getBackupsFromDevice(current, true);
    } else {
      backups = await window.electron.getBackupsFromDevice(selected, selected.id === current?.id);
    }
    window.electron.logger.info({ msg: 'Backups fetched', length: backups.length });
    setBackups(backups);
  }

  const validateIfBackupExists = async () => {
    const existsBackup = devices.some((device) => device.hasBackups);
    window.electron.logger.info({
      msg: 'Backup exists',
      devices: devices.map((d) => d.name),
      existsBackup,
    });
    setExistsBackup(existsBackup);
  };

  const isUserElegible = async () => {
    const isAntivirusAvailable = await window.electron.backups.isAvailable();
    setIsBackupAvailable(isAntivirusAvailable);
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
    isUserElegible();
    validateIfBackupExists();
    loadBackups();
  }, [selected, devices]);

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

  async function downloadBackups(device: Device, folderUuids?: string[]) {
    try {
      await window.electron.downloadBackup(device, folderUuids);
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
    isBackupAvailable,
    existsBackup,
  };
}
