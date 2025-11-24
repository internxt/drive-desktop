import { useContext, useEffect, useState } from 'react';
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
    return globalThis.window.electron.onBackupDownloadProgress(({ id, progress }) =>
      setBackupDownloadProgress((prevState) => {
        return { ...prevState, [id]: Math.round(progress) };
      }),
    );
  }, []);

  const [thereIsDownloadProgress, setThereIsDownloadProgress] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);

  useEffect(() => {
    if (!selected?.uuid) return;
    const downloadProgress = backupDownloadProgress[selected.uuid];
    if (downloadProgress && downloadProgress < 100) {
      setThereIsDownloadProgress(true);
      setDownloadProgress(downloadProgress);
    } else {
      setThereIsDownloadProgress(false);
      setDownloadProgress(0);
    }
  }, [selected, backupDownloadProgress]);

  return {
    thereIsDownloadProgress,
    downloadProgress,
  };
}
