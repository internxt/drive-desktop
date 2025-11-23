import { useContext, useEffect, useMemo, useState } from 'react';
import { DeviceContext } from '../../context/DeviceContext';

interface DownloadBackupProgress {
  [key: string]: number;
}

export interface BackupDownloadContextProps {
  thereIsDownloadProgress: boolean;
  downloadProgress: number;
}

export function useBackupDownloadProgress(): BackupDownloadContextProps {
  const { selected } = useContext(DeviceContext);

  const [backupDownloadProgress, setBackupDownloadProgress] = useState<DownloadBackupProgress>({});

  useEffect(() => {
    return window.electron.onBackupDownloadProgress(({ id, progress }) => {
      setBackupDownloadProgress((prevState) => {
        return { ...prevState, [id]: Math.round(progress) };
      });
    });
  }, []);

  const downloadProgress = useMemo(() => {
    if (!selected) return 0;

    const downloadProgress = backupDownloadProgress[selected.uuid];

    if (!downloadProgress) return 0;

    return downloadProgress;
  }, [selected, backupDownloadProgress]);

  return {
    thereIsDownloadProgress: downloadProgress > 0,
    downloadProgress,
  };
}
