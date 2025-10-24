import { useI18n } from '@/apps/renderer/localize/use-i18n';
import DriveIcon from '../../../assets/backups/DriveIcon.svg';
import Button from '../../../components/Button';

interface EnableBackupsProps {
  enable: () => Promise<void>;
}

export function EnableBackups({ enable }: EnableBackupsProps) {
  const { t } = useI18n();

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <DriveIcon className="mt-6" />
      <h1 className="font-semibold">INTERNXT BACKUPS</h1>
      <p className="mb-6 text-center">{t('settings.backups.enable.message')}</p>

      <Button onClick={enable}>{t('settings.backups.enable.action')}</Button>
    </div>
  );
}
