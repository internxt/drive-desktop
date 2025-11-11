import { useContext, useState } from 'react';
import Button from '../../../components/Button';
import { BackupContext } from '../../../context/BackupContext';
import { ConfirmationModal } from '../../../components/Backups/Delete/ConfirmationModal';
import { useI18n } from '@/apps/renderer/localize/use-i18n';

type StartBackupProps = {
  className: string;
};

export function StartBackup({ className }: StartBackupProps) {
  const { translate } = useI18n();
  const { backups, backupStatus, thereIsDownloadProgress } = useContext(BackupContext);
  const [askConfirmation, setAskConfirmation] = useState(false);

  function toggleConfirmation() {
    setAskConfirmation(!askConfirmation);
  }

  function stopBackupsProcess() {
    window.electron.stopBackupsProcess();
    toggleConfirmation();
  }

  function startBackupsProcess() {
    window.electron.startBackupsProcess();
  }

  return (
    <>
      <Button
        className={className}
        variant={backupStatus === 'STANDBY' ? 'primary' : 'danger'}
        size="md"
        onClick={() => {
          if (backupStatus === 'STANDBY') {
            startBackupsProcess();
          } else {
            toggleConfirmation();
          }
        }}
        disabled={backups.length === 0 || thereIsDownloadProgress || backupStatus === 'STOPPING'}>
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
    </>
  );
}
