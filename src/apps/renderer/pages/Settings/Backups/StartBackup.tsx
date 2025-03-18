import { useContext, useState } from 'react';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';
import { ConfirmationModal } from '../../../components/Backups/Delete/ConfirmationModal';
import { useUserAvailableProducts } from '../../../hooks/useUserAvailableProducts/useUserAvailableProducts';

type StartBackupProps = {
  className: string;
};

export function StartBackup({ className }: StartBackupProps) {
  const [showFeatureLockedModal, setShowFeatureLockedModal] = useState(false);
  const { backups, backupStatus } = useContext(BackupContext);
  const { translate } = useTranslationContext();
  const { products } = useUserAvailableProducts();

  const userCanBackup = products?.backups;

  function handleSetShowFeatureLockedModal(show: boolean): void  {
    setShowFeatureLockedModal(show);
  }

  function handleStartBackup(): void{
    if (!userCanBackup) {
      handleSetShowFeatureLockedModal(true);
      return;
    }

    if (backupStatus === 'STANDBY') {
      window.electron.startBackupsProcess();
    } else {
      window.electron.stopBackupsProcess();
    }
  }

  async function handleOpenInternxtPricingUrl (): Promise<void> {
    await window.electron.openUrl('https://internxt.com/pricing');
    handleSetShowFeatureLockedModal(false);
  }

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
        size="md"
        onClick={handleStartBackup}
        disabled={backups.length === 0}
      >
        {translate(
          `settings.backups.action.${
            backupStatus === 'STANDBY' ? 'start' : 'stop'
          }`
        )}
      </Button>
      {!userCanBackup && (
        <ConfirmationModal
          show={showFeatureLockedModal}
          onCanceled={() => handleSetShowFeatureLockedModal(false)}
          onConfirmed={handleOpenInternxtPricingUrl}
          title={translate('settings.backups.featureLocked.title')}
          explanation={translate('settings.backups.featureLocked.subtitle')}
          cancelText={translate('common.cancel')}
          confirmText={translate('settings.backups.featureLocked.action')}
          variantButton="primary"
        />
      )}
    </>
  );
}
