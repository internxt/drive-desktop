import { ShieldWarning } from 'phosphor-react';
import Button from '../../../../components/Button';

interface ErrorWhileScanningItemsProps {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
  onScanAgainButtonClicked: () => void;
}

export const ErrorWhileScanningItems = ({
  translate,
  onScanAgainButtonClicked,
}: ErrorWhileScanningItemsProps) => (
  <div
    className="flex flex-col items-center gap-4"
    data-testid="error-while-scanning-items-container"
  >
    <ShieldWarning
      size={64}
      className="text-red"
      weight="fill"
      data-testid="shield-warning-icon"
    />
    <div className="flex flex-col gap-1 text-center">
      <p className="font-medium text-gray-100">
        {translate('settings.antivirus.errorState.title')}
      </p>
    </div>
    <Button onClick={onScanAgainButtonClicked}>
      {translate('settings.antivirus.errorState.button')}
    </Button>
  </div>
);
