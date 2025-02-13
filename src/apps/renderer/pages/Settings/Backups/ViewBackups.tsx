import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement> & {
  showDownloadFolers: () => void;
};

export function ViewBackups({ className, showDownloadFolers }: ViewBackupsProps) {
  const { translate } = useTranslationContext();

  return (
    <>
      <Button className={`${className} hover:cursor-pointer`} variant="secondary" onClick={showDownloadFolers}>
        {translate('settings.backups.view-backups')}
      </Button>
    </>
  );
}
