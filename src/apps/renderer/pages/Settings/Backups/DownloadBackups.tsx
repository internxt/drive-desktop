import { useContext } from 'react';
import Button from '../../../components/Button';
import { DeviceContext } from '../../../context/DeviceContext';
import { BackupContext } from '../../../context/BackupContext';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement>;

export function DownloadBackups({ className }: ViewBackupsProps) {
  const { t } = useI18n();
  const { selected: device } = useContext(DeviceContext);
  const { backups, thereIsDownloadProgress, backupStatus } = useContext(BackupContext);

  async function handleDownloadBackup() {
    if (device) {
      if (!thereIsDownloadProgress) {
        await globalThis.window.electron.downloadBackup({ device });
      } else {
        globalThis.window.electron.abortDownloadBackups(device.uuid);
      }
    }
  }

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant={thereIsDownloadProgress ? 'danger' : 'secondary'}
        onClick={handleDownloadBackup}
        disabled={backups.length === 0 || backupStatus !== 'STANDBY'}>
        {thereIsDownloadProgress ? t('settings.backups.action.stopDownload') : t('settings.backups.action.download')}
      </Button>
    </>
  );
}
