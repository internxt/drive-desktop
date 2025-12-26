import { useContext, useEffect, useState } from 'react';
import { BackupInfo } from '../../../backups/BackupInfo';
import { DeviceContext } from '../../context/DeviceContext';
import { Device } from '../../../main/device/service';
import { useDevices } from '../devices/useDevices';

export type BackupsState = 'LOADING' | 'ERROR' | 'SUCCESS';

export interface BackupContextProps {
  backupsState: BackupsState;
  backups: BackupInfo[];
  disableBackup: (folderId: number) => Promise<void>;
  addBackup: () => Promise<void>;
  deleteBackups: (device: Device, isCurrent?: boolean) => Promise<void>;
  refreshBackups: () => Promise<void>;
  existsBackup: boolean;
}

export function useBackups(): BackupContextProps {
  const { selected, current } = useContext(DeviceContext);
  const [backupsState, setBackupsState] = useState<BackupsState>('LOADING');
  const [backups, setBackups] = useState<Array<BackupInfo>>([]);
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
    window.electron.logger.debug({ msg: 'Backups fetched', length: backups.length });
    setBackups(backups);
  }

  const validateIfBackupExists = async () => {
    const existsBackup = devices.some((device) => device.hasBackups);
    window.electron.logger.debug({
      msg: 'Backup exists',
      devices: devices.map((d) => d.plainName),
      existsBackup,
    });
    setExistsBackup(existsBackup);
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
    validateIfBackupExists();
    loadBackups();
  }, [selected, devices]);

  async function addBackup(): Promise<void> {
    try {
      await window.electron.addBackup();
      await loadBackups();
    } catch {
      setBackupsState('ERROR');
    }
  }

  async function disableBackup(folderId: number) {
    await window.electron.disableBackup(folderId);
    await loadBackups();
  }

  async function deleteBackups(device: Device, isCurrent?: boolean) {
    setBackupsState('LOADING');
    try {
      await window.electron.deleteBackupsFromDevice({ device, isCurrent });
      await fetchBackups();
      setBackupsState('SUCCESS');
    } catch {
      setBackupsState('ERROR');
    }
  }

  return {
    backupsState,
    backups,
    refreshBackups: fetchBackups,
    disableBackup,
    addBackup,
    deleteBackups,
    existsBackup,
  };
}
