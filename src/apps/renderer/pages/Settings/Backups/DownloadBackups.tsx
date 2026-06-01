import { useContext } from 'react';
import Button from '../../../components/Button';
import { DeviceContext } from '../../../context/DeviceContext';
import { BackupContext } from '../../../context/BackupContext';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement>;

export function DownloadBackups({ className }: ViewBackupsProps) {
  const { selected } = useContext(DeviceContext);
  const { backups, downloadBackups, abortDownloadBackups, thereIsDownloadProgress, clearBackupDownloadProgress } =
    useContext(BackupContext);

  const handleDownloadBackup = async () => {
    if (!selected) return;

    if (!thereIsDownloadProgress) {
      const chosenFolder = await window.electron.getFolderPath();
      if (!chosenFolder) return;
      await downloadBackups(selected, chosenFolder.path);
      return;
    }

    try {
      abortDownloadBackups(selected);
    } catch (err) {
      // error while aborting (aborting also throws an exception itself)
    } finally {
      setTimeout(() => {
        clearBackupDownloadProgress(selected.uuid);
      }, 600);
    }
  };

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant="secondary"
        onClick={handleDownloadBackup}
        disabled={backups.length === 0}>
        {thereIsDownloadProgress ? 'Stop download' : 'Download'}
      </Button>
    </>
  );
}
