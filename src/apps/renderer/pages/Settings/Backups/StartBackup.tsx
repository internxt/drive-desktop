import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import { useBackups } from '../../../hooks/backups/useBackups';
import useBackupStatus from '../../../hooks/backups/useBackupsStatus';

type StartBackupProps = {
  className: string;
};

export function StartBackup({ className }: StartBackupProps) {
  const { backupStatus } = useBackupStatus();
  const { backups } = useBackups();

  const { translate } = useTranslationContext();

  return (
    <Button
      className={`${className} hover:cursor-pointer`}
      variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
      size="md"
      onClick={() => {
        backupStatus === 'STANDBY'
          ? window.electron.startBackupsProcess()
          : window.electron.stopBackupsProcess();
      }}
      disabled={backups.length === 0}
    >
      {translate(
        `settings.backups.action.${
          backupStatus === 'STANDBY' ? 'start' : 'stop'
        }`
      )}
    </Button>
  );
}
