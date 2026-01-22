import { useI18n } from '@/apps/renderer/localize/use-i18n';
import Button from '../../../components/Button';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement> & {
  showDownloadFolders: () => void;
};

export function ViewBackups({ className, showDownloadFolders }: ViewBackupsProps) {
  const { translate } = useI18n();

  return (
    <>
      <Button className={`${className} hover:cursor-pointer`} variant="secondary" onClick={showDownloadFolders}>
        {translate('settings.backups.view-backups')}
      </Button>
    </>
  );
}
