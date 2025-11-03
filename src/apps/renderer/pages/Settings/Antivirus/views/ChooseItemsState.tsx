import { useTranslationContext } from '../../../../context/LocalContext';
import Button from '../../../../components/Button';
import { useAntivirusContext } from '../../../../context/AntivirusContext';
import { CustomScanItemsSelectorDropdown } from '../components/CustomScanItemsSelectorDropdown';

export const ChooseItemsState = () => {
  const { translate } = useTranslationContext();
  const { isAntivirusAvailable, onCustomScanButtonClicked, onScanUserSystemButtonClicked } = useAntivirusContext();

  return (
    <div className="flex flex-col gap-4 p-10" data-testid="choose-items-container">
      <div
        className="flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3"
        data-testid="scan-option-container">
        <p className="font-medium text-gray-80">{translate('settings.antivirus.scanOptions.systemScan.text')}</p>
        <Button onClick={onScanUserSystemButtonClicked} disabled={!isAntivirusAvailable}>
          {translate('settings.antivirus.scanOptions.systemScan.action')}
        </Button>
      </div>

      <div
        className="flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3"
        data-testid="scan-option-container">
        <p className="font-medium text-gray-80">{translate('settings.antivirus.scanOptions.customScan.text')}</p>
        <CustomScanItemsSelectorDropdown
          translate={translate}
          disabled={!isAntivirusAvailable}
          onScanItemsButtonClicked={onCustomScanButtonClicked}
        />
      </div>
    </div>
  );
};
