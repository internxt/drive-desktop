import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';

type ViewBackupsProps = React.HTMLAttributes<HTMLBaseElement>;

export function ViewBackups({ className }: ViewBackupsProps) {
  const { translate } = useTranslationContext();

  const handleOpenURL = async () => {
    try {
      await window.electron.openUrl('https://drive.internxt.com/app/backups');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant="secondary"
        onClick={handleOpenURL}
      >
        {translate('settings.backups.view-backups')}
      </Button>
    </>
  );
}
