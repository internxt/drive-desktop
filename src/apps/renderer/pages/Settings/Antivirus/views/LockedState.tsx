// TODO: Move this whole component to a more generic location beceause its used in more places
import Button from '../../../../components/Button';
import { useTranslationContext } from '../../../../context/LocalContext';
import { reportError } from '../../../../utils/errors';

export const LockedState = () => {
  const { translate } = useTranslationContext();

  const handleOpenPricingPage = async () => {
    try {
      await window.electron.openUrl('https://internxt.com/pricing');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div
      className="flex flex-col items-center p-5"
      data-testid="locked-state-container"
    >
      <div
        className="flex flex-col items-center gap-4 text-center"
        data-testid="locked-state-content"
      >
        <div className="flex flex-col">
          <p className="font-medium text-gray-100">
            {translate('settings.antivirus.featureLocked.title')}
          </p>
          <p className="text-sm text-gray-80">
            {translate('settings.antivirus.featureLocked.subtitle')}
          </p>
        </div>
        <Button onClick={handleOpenPricingPage} className="w-max">
          {translate('settings.antivirus.featureLocked.action')}
        </Button>
      </div>
    </div>
  );
};
