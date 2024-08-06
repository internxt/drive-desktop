import { useContext } from 'react';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';

type StartBackupProps = {
  className: string;
};

export function StartBackup({ className }: StartBackupProps) {
  const { backups, backupStatus } = useContext(BackupContext);

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
