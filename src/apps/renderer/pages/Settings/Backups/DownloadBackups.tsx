import { useContext } from 'react';
import Button from '../../../components/Button';
import { DeviceContext } from '../../../context/DeviceContext';
import { BackupContext } from '../../../context/BackupContext';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement>;

export function DownloadBackups({ className }: ViewBackupsProps) {
  const { selected } = useContext(DeviceContext);
  const { backups } = useContext(BackupContext);

  const handleDownloadBackup = async () => {
    try {
      await window.electron.downloadBackup(selected!);
    } catch (error) {
      reportError(error);
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
        Download
      </Button>
    </>
  );
}
