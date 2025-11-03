import { ShieldWarning } from 'phosphor-react';
import Button from '../../../../components/Button';

interface CorruptedItemsFoundProps {
  translate: (key: string, keysToReplace?: Record<string, string | number>) => string;
  onRemoveMalwareButtonClicked: () => void;
}

export const CorruptedItemsFound = ({ translate, onRemoveMalwareButtonClicked }: CorruptedItemsFoundProps) => (
  <div className="flex flex-col items-center gap-4" data-testid="corrupted-items-container">
    <ShieldWarning size={64} className="text-red" weight="fill" data-testid="shield-warning-icon" />
    <div className="flex flex-col gap-1 text-center" data-testid="corrupted-items-text-container">
      <p className="font-medium text-gray-100">{translate('settings.antivirus.scanProcess.malwareFound.title')}</p>
      <p className="text-sm text-gray-80">{translate('settings.antivirus.scanProcess.malwareFound.subtitle')}</p>
    </div>
    <Button onClick={onRemoveMalwareButtonClicked} data-testid="remove-malware-button">
      {translate('settings.antivirus.scanProcess.malwareFound.action')}
    </Button>
  </div>
);
