import { LockedState } from './views/LockedState';
import { ChooseItemsState } from './views/ChooseItemsState';
import { ScanState } from './views/ScanState';
import { Views } from '../../../hooks/antivirus/useAntivirus';
import { useAntivirusContext } from '../../../context/AntivirusContext';
import { ActionDialog } from './components/ActionDialog';
import { useTranslationContext } from '../../../context/LocalContext';

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
  const { translate } = useTranslationContext();
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
    isDefenderActive,
    showErrorState,
    onScanUserSystemButtonClicked,
    onScanAgainButtonClicked,
    onCustomScanButtonClicked,
    onCancelScan,
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
  };

  return (
    <section className={`${active ? 'block' : 'hidden'} relative h-full w-full`}>
      <div className="flex h-full w-full flex-col">{viewStates[view]}</div>
      {isDefenderActive && isAntivirusAvailable && active && (
        <ActionDialog
          showDialog={isDefenderActive && active}
          title={translate('settings.antivirus.deactivateAntivirus.title')}
          children={<p>{translate('settings.antivirus.deactivateAntivirus.description')}</p>}
          confirmText={translate('settings.antivirus.deactivateAntivirus.retry')}
          cancelText={translate('settings.antivirus.deactivateAntivirus.cancel')}
          confirmButtonVariant="primary"
          onCancel={onCancelDeactivateWinDefender}
          onConfirm={async () => await isWinDefenderActive()}
        />
      )}
    </section>
  );
}
