import Button from '../../../../components/Button';

interface ScanProcessProps {
  currentScanPath?: string;
  stopScanProcess: () => void;
  scannedProcess: number;
  translate: (
    key: string,
    keysToReplace?: Record<string, string | number>
  ) => string;
}

export const ScanProcess = ({
  currentScanPath,
  scannedProcess,
  stopScanProcess,
  translate,
}: ScanProcessProps) => (
  <div
    className="flex w-full flex-col items-center gap-4"
    data-testid="scan-process-container"
  >
    <div className="flex h-20 w-full max-w-[450px] flex-col text-center">
      <p>{translate('settings.antivirus.scanProcess.scanning')}</p>
      <p className="line-clamp-2">{currentScanPath}</p>
    </div>
    <div className="flex w-full flex-col items-center gap-1">
      <div className="flex h-1.5 w-full flex-col rounded-full bg-primary/10">
        <div
          className="flex h-full rounded-full bg-primary"
          style={{
            width: `${scannedProcess}%`,
          }}
        />
      </div>
      <p>{scannedProcess}%</p>
    </div>
    <Button variant="danger" onClick={stopScanProcess}>
      {translate('settings.antivirus.scanOptions.stopScan')}
    </Button>
  </div>
);
