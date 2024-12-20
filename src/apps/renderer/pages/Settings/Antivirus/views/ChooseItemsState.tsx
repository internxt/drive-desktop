import { useTranslationContext } from '../../../../context/LocalContext';
import Button from '../../../../components/Button';

interface ScannerSelectorCardProps {
  title: string;
  cta: string;
  disabledButton: boolean;
  onClick: () => void;
}

const ScannerSelectorCard = ({
  title,
  cta,
  disabledButton,
  onClick,
}: ScannerSelectorCardProps) => (
  <div className="flex w-full flex-row items-center justify-between rounded-lg border border-gray-10 bg-surface px-4 py-3">
    <p className="font-medium text-gray-80">{title}</p>
    <Button onClick={onClick} disabled={disabledButton}>
      {cta}
    </Button>
  </div>
);

interface ItemsToScanSelectorProps {
  areFeaturesLocked: boolean;
  onScanUserSystemButtonClicked: () => void;
  onSelectFoldersButtonClicked: () => void;
}

export const ChooseItemsState = ({
  areFeaturesLocked,
  onScanUserSystemButtonClicked,
  onSelectFoldersButtonClicked,
}: ItemsToScanSelectorProps) => {
  const { translate } = useTranslationContext();

  return (
    <div className="flex flex-col gap-4 p-10">
      <ScannerSelectorCard
        title={translate('settings.antivirus.scanOptions.systemScan.text')}
        cta={translate('settings.antivirus.scanOptions.systemScan.action')}
        disabledButton={areFeaturesLocked}
        onClick={onScanUserSystemButtonClicked}
      />
      <ScannerSelectorCard
        title={translate('settings.antivirus.scanOptions.customScan.text')}
        cta={translate('settings.antivirus.scanOptions.customScan.action')}
        disabledButton={areFeaturesLocked}
        onClick={onSelectFoldersButtonClicked}
      />
    </div>
  );
};
