import Button from '../../../../components/Button';
import { ScanSuccessful } from './ScanSuccessful';
import { CorruptedItemsFound } from './CorruptedItemsFound';

interface ScanResultProps {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
  onScanAgainButtonClicked: () => void;
  onRemoveMalwareButtonClicked: () => void;
  thereAreCorruptedFiles: boolean;
}

export const ScanResult = ({
  thereAreCorruptedFiles,
  onScanAgainButtonClicked,
  translate,
  onRemoveMalwareButtonClicked,
}: ScanResultProps) => {
  if (thereAreCorruptedFiles) {
    return (
      <CorruptedItemsFound
        translate={translate}
        onRemoveMalwareButtonClicked={onRemoveMalwareButtonClicked}
      />
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-5"
      data-testid="scan-result-container"
    >
      <ScanSuccessful translate={translate} />
      <Button
        onClick={onScanAgainButtonClicked}
        data-testid="scan-again-button"
      >
        {translate('settings.antivirus.scanProcess.scanAgain')}
      </Button>
    </div>
  );
};
