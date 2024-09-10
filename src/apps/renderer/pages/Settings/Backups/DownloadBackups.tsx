import { useContext } from 'react';
import Button from '../../../components/Button';
import { DeviceContext } from '../../../context/DeviceContext';
import { BackupContext } from '../../../context/BackupContext';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement>;

export function DownloadBackups({ className }: ViewBackupsProps) {
  const { selected } = useContext(DeviceContext);
  const {
    backups,
    downloadBackups,
    abortDownloadBackups,
    thereIsDownloadProgress,
    clearBackupDownloadProgress,
  } = useContext(BackupContext);

  const handleDownloadBackup = async () => {
    if (!thereIsDownloadProgress) {
      await downloadBackups(selected!);
    } else {
      try {
        abortDownloadBackups(selected!);
      } catch (err) {
        // error while aborting (aborting also throws an exception itself)
      } finally {
        setTimeout(() => {
          clearBackupDownloadProgress(selected!.uuid);
        }, 600);
      }
    }
  };

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant="secondary"
        onClick={handleDownloadBackup}
        disabled={backups.length === 0}
      >
        {thereIsDownloadProgress ? 'Stop download' : 'Download'}
      </Button>
    </>
  );
}
