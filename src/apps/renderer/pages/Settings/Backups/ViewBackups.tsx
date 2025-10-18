import { useI18n } from '@/apps/renderer/localize/use-i18n';
import Button from '../../../components/Button';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement> & {
  showDownloadFolers: () => void;
};

export function ViewBackups({ className, showDownloadFolers }: ViewBackupsProps) {
  const { translate } = useI18n();

  return (
    <>
      <Button className={`${className} hover:cursor-pointer`} variant="secondary" onClick={showDownloadFolers}>
        {translate('settings.backups.view-backups')}
      </Button>
    </>
  );
}
