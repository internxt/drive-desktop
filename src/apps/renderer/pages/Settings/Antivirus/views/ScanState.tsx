import { useTranslationContext } from '../../../../context/LocalContext';
import { useAntivirusContext } from '../../../../context/AntivirusContext';
import { ScanProcess } from '../components/ScanProcess';
import { ScanResult } from '../components/ScanResult';
import { ErrorWhileScanningItems } from '../components/ErrorWhileScanningItems';
import { ScanStatistics } from '../components/ScanStatistics';

interface ScanStateProps {
  showItemsWithMalware: () => void;
}

export const ScanState = ({ showItemsWithMalware }: ScanStateProps) => {
  const { translate } = useTranslationContext();
  const {
    isScanning,
    isScanCompleted,
    infectedFiles: corruptedFiles,
    currentScanPath,
    progressRatio,
    countScannedFiles: scannedFilesCount,
    showErrorState,
    onCancelScan: onStopProgressScanButtonClicked,
    onScanAgainButtonClicked,
  } = useAntivirusContext();

  const thereAreCorruptedFiles = corruptedFiles.length > 0;

  return (
    <section className="flex w-full flex-col items-center justify-center">
      <div className="flex h-full max-h-[320px] w-full max-w-[590px] flex-col items-center justify-center gap-10 p-5">
        {isScanning && (
          <ScanProcess
            currentScanPath={currentScanPath}
            scannedProcess={progressRatio}
            stopScanProcess={onStopProgressScanButtonClicked}
            translate={translate}
          />
        )}

        {!isScanning && isScanCompleted && (
          <ScanResult
            thereAreCorruptedFiles={thereAreCorruptedFiles}
            translate={translate}
            onScanAgainButtonClicked={onScanAgainButtonClicked}
            onRemoveMalwareButtonClicked={showItemsWithMalware}
          />
        )}

        {isScanCompleted && showErrorState && (
          <ErrorWhileScanningItems translate={translate} onScanAgainButtonClicked={onScanAgainButtonClicked} />
        )}

        {!showErrorState && (
          <ScanStatistics scannedFilesCount={scannedFilesCount} corruptedFilesCount={corruptedFiles.length} />
        )}
      </div>
    </section>
  );
};
