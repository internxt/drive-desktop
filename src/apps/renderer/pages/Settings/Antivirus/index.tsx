import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanningState } from './views/ScanState';
import { useAntivirus } from '../../../hooks/antivirus/useAntivirus';

interface AntivirusSectionProps {
  active: boolean;
}

export default function AntivirusSection({ active }: AntivirusSectionProps) {
  const isFreeUserPlan = true;
  const {
    isScanning,
    countScannedFiles,
    currentScanPath,
    onScanUserSystemButtonClicked,
    onSelectFoldersButtonClicked,
  } = useAntivirus();

  return (
    <section className={`${active ? 'block' : 'hidden'} h-full w-full`}>
      <div className="flex h-full w-full flex-col">
        {!isFreeUserPlan && <LockedState />}
        {isFreeUserPlan && !isScanning && (
          <ChooseItemsState
            areFeaturesLocked={!isFreeUserPlan}
            onScanUserSystemButtonClicked={onScanUserSystemButtonClicked}
            onSelectFoldersButtonClicked={onSelectFoldersButtonClicked}
          />
        )}
        {isScanning && (
          <ScanningState
            isScanning={isScanning}
            scannedFilesCount={countScannedFiles}
            currentScanPath={currentScanPath}
            corruptedFiles={[]}
          />
        )}
      </div>
    </section>
  );
}
