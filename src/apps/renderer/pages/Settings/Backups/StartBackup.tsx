import { useContext, useState } from 'react';
import Button from '../../../components/Button';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';
import { ConfirmationModal } from '../../../components/Backups/Delete/ConfirmationModal';

type StartBackupProps = {
  className: string;
};

export function StartBackup({ className }: StartBackupProps) {
  const { backups, backupStatus, thereIsDownloadProgress, clearLastBackupExitReason, isBackupAvailable } = useContext(BackupContext);
  const [askConfirmation, setAskConfirmation] = useState(false);
  const [avalaibleAlert, setAvalaibleAlert] = useState(false);

  function toggleConfirmation() {
    setAskConfirmation(!askConfirmation);
  }

  async function stopBackupsProcess() {
    window.electron.stopBackupsProcess();
    toggleConfirmation();
  }

  async function startBackupsProcess() {
    clearLastBackupExitReason();
    window.electron.startBackupsProcess();
  }

  const { translate } = useTranslationContext();

  return (
    <>
      <Button
        className={`${className} hover:cursor-pointer`}
        variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
        size="md"
        onClick={() => {
          if (!isBackupAvailable) {
            setAvalaibleAlert(true);
            return;
          }
          backupStatus === 'STANDBY' ? startBackupsProcess() : toggleConfirmation();
        }}
        disabled={backups.length === 0 || thereIsDownloadProgress}>
        {translate(`settings.backups.action.${backupStatus === 'STANDBY' ? 'start' : 'stop'}`)}
      </Button>
      <ConfirmationModal
        show={askConfirmation}
        onCanceled={toggleConfirmation}
        onConfirmed={stopBackupsProcess}
        title={translate('settings.backups.stop.modal.title')}
        explanation={translate('settings.backups.stop.modal.explanation')}
        explanation2={translate('settings.backups.stop.modal.explanation-2')}
        cancelText={translate('settings.backups.stop.modal.cancel')}
        confirmText={translate('settings.backups.stop.modal.confirm')}
        variantButton="primary"
      />
      <ConfirmationModal
        show={avalaibleAlert}
        onCanceled={() => setAvalaibleAlert(false)}
        onConfirmed={async () => {
          await window.electron.openUrl('https://internxt.com/pricing');
          setAvalaibleAlert(false);
        }}
        title={translate('settings.antivirus.featureLocked.title')}
        explanation={translate('settings.antivirus.featureLocked.subtitle')}
        cancelText={translate('settings.backups.stop.modal.cancel')}
        confirmText={translate('settings.antivirus.featureLocked.action')}
        variantButton="primary"
      />
    </>
  );
}
