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
    thereIsDownloadProgress,
    clearBackupDownloadProgress,
  } = useContext(BackupContext);

  const handleDownloadBackup = async () => {
    if (!thereIsDownloadProgress) {
      await downloadBackups(selected!);
    } else {
      //await abortDownloadBackups(selected!);
      clearBackupDownloadProgress(selected!.uuid);
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
