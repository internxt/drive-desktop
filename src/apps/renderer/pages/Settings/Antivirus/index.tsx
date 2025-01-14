import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanState } from './views/ScanState';
import { useAntivirus, Views } from '../../../hooks/antivirus/useAntivirus';

interface AntivirusSectionProps {
  active: boolean;
}

export default function AntivirusSection({ active }: AntivirusSectionProps) {
  const isFreeUserPlan = false;
  const {
    isScanning,
    isScanCompleted,
    selectedItems,
    countScannedFiles,
    scannedItems,
    currentScanPath,
    view,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
  } = useAntivirus();

  const viewStates: Record<Views, JSX.Element> = {
    locked: <LockedState />,
    chooseItems: (
      <ChooseItemsState
        areFeaturesLocked={isFreeUserPlan}
        onScanButtonClicked={onCustomScanButtonClicked}
        onScanUserSystemButtonClicked={onScanUserSystemButtonClicked}
      />
    ),
    scan: (
      <ScanState
        isScanning={isScanning}
        isScanCompleted={isScanCompleted}
        scannedFilesCount={countScannedFiles}
        selectedItems={selectedItems.length}
        onScanAgainButtonClicked={onScanAgainButtonClicked}
        currentScanPath={currentScanPath}
        corruptedFiles={scannedItems}
      />
    ),
  };

  return (
    <section className={`${active ? 'block' : 'hidden'} h-full w-full`}>
      <div className="flex h-full w-full flex-col">{viewStates[view]}</div>
    </section>
  );
}
