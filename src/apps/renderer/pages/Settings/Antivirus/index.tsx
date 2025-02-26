import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanState } from './views/ScanState';
import { Views } from '../../../hooks/antivirus/useAntivirus';
import { useAntivirusContext } from '../../../context/AntivirusContext';

interface AntivirusSectionProps {
  active: boolean;
  showItemsWithMalware: () => void;
}

export default function AntivirusSection({
  active,
  showItemsWithMalware,
}: AntivirusSectionProps): JSX.Element {
  const {
    isScanning,
    isScanCompleted,
    countScannedFiles,
    infectedFiles,
    currentScanPath,
    progressRatio,
    isAntivirusAvailable,
    showErrorState,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onCancelScan,
    view,
  } = useAntivirusContext();

  const viewStates: Record<Views, JSX.Element> = {
    locked: <LockedState />,
    chooseItems: (
      <ChooseItemsState
        isUserElegible={isAntivirusAvailable}
        onScanButtonClicked={onCustomScanButtonClicked}
        onScanUserSystemButtonClicked={onScanUserSystemButtonClicked}
      />
    ),
    scan: (
      <ScanState
        isScanning={isScanning}
        isScanCompleted={isScanCompleted}
        scannedFilesCount={countScannedFiles}
        progressRatio={progressRatio}
        currentScanPath={currentScanPath}
        corruptedFiles={infectedFiles}
        showErrorState={showErrorState}
        onStopProgressScanButtonClicked={onCancelScan}
        onScanAgainButtonClicked={onScanAgainButtonClicked}
        showItemsWithMalware={showItemsWithMalware}
      />
    ),
  };

  return (
    <section
      className={`${active ? 'block' : 'hidden'} relative h-full w-full`}
    >
      <div className="flex h-full w-full flex-col">{viewStates[view]}</div>
    </section>
  );
}
