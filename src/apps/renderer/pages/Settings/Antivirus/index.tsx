import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanState } from './views/ScanState';
import { Views } from '../../../hooks/antivirus/useAntivirus';
import { useAntivirusContext } from '../../../context/AntivirusContext';
import { ActionDialog } from './components/ActionDialog';

interface AntivirusSectionProps {
  active: boolean;
  onCancelDeactivateWinDefender: () => void;
  showItemsWithMalware: () => void;
}

export default function AntivirusSection({
  active,
  onCancelDeactivateWinDefender,
  showItemsWithMalware,
}: AntivirusSectionProps): JSX.Element {
  const {
    isScanning,
    isScanCompleted,
    countScannedFiles,
    countCorruptedFiles,
    currentScanPath,
    view,
    progressRatio,
    isError,
    isAntivirusAvailable,
    isDefenderActive,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    isWinDefenderActive,
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
        errorWhileScanning={isError}
        currentScanPath={currentScanPath}
        corruptedFiles={countCorruptedFiles}
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
      {isDefenderActive && active && (
        <ActionDialog
          showDialog={isDefenderActive && active}
          title="Windows Defender is active"
          children={
            <p>
              Please disable Windows Defender to be able to use Internxt
              Antivirus. To do this, open Windows Security {'>'} Virus and
              Threat Protection {'>'} Manage settings {'>'} disable Real-time
              protection.
            </p>
          }
          confirmText="Retry"
          cancelText="Cancel"
          confirmButtonVariant="primary"
          onCancel={onCancelDeactivateWinDefender}
          onConfirm={async () => await isWinDefenderActive()}
        />
      )}
    </section>
  );
}
