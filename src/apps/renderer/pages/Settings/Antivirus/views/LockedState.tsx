import { useI18n } from '@/apps/renderer/localize/use-i18n';
import Button from '../../../../components/Button';

export const LockedState = () => {
  const { translate } = useI18n();

  const handleOpenPricingPage = async () => {
    try {
      await window.electron.openUrl('https://internxt.com/pricing');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="flex flex-col items-center p-5">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex flex-col">
          <p className="font-medium text-gray-100">{translate('settings.antivirus.featureLocked.title')}</p>
          <p className="text-sm text-gray-80">{translate('settings.antivirus.featureLocked.subtitle')}</p>
        </div>
        <Button onClick={handleOpenPricingPage} className="w-max">
          {translate('settings.antivirus.featureLocked.action')}
        </Button>
      </div>
    </div>
  );
};
