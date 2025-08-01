import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanState } from './views/ScanState';
import { Views } from '../../../hooks/antivirus/useAntivirus';
import { useAntivirusContext } from '../../../context/AntivirusContext';
import { useEffect } from 'react';
import { Spinner } from 'phosphor-react';

type AntivirusSectionProps = {
  active: boolean;
  onCancelDeactivateWinDefender: () => void;
  showItemsWithMalware: () => void;
};

export default function AntivirusSection({ active, showItemsWithMalware }: AntivirusSectionProps): JSX.Element {
  const {
    isScanning,
    isScanCompleted,
    countScannedFiles,
    infectedFiles,
    currentScanPath,
    countFiles,
    view,
    progressRatio,
    isAntivirusAvailable,
    showErrorState,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    isUserElegible,
    onCancelScan,
    isWinDefenderActive,
  } = useAntivirusContext();

  useEffect(() => {
    if (!active) return;
    isUserElegible();
    isWinDefenderActive();
  }, [active]);

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
        countFiles={countFiles}
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
    loading: (
      <div className="flex h-[200px] w-full flex-col items-center justify-center">
        <Spinner className="animate-spin" />
      </div>
    ),
  };

  return (
    <section className={`${active ? 'block' : 'hidden'} relative h-full w-full`}>
      <div className="flex h-full w-full flex-col">{viewStates[view]}</div>
    </section>
  );
}
