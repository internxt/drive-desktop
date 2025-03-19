import { ShieldCheck } from 'phosphor-react';

interface ScanSuccessfulProps {
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
}

export const ScanSuccessful = ({ translate }: ScanSuccessfulProps) => (
  <div
    className="flex flex-col items-center gap-4"
    data-testid="scan-successful-container"
  >
    <ShieldCheck
      size={64}
      className="text-green"
      weight="fill"
      data-testid="shield-check-icon"
    />
    <div className="flex flex-col gap-1 text-center">
      <p className="font-medium text-gray-100">
        {translate('settings.antivirus.scanProcess.noFilesFound.title')}
      </p>
      <p className="text-sm text-gray-80">
        {translate('settings.antivirus.scanProcess.noFilesFound.subtitle')}
      </p>
    </div>
  </div>
);
