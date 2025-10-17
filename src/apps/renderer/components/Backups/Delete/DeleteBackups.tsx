import { SecondaryText } from '../../SecondaryText';
import { SectionHeader } from '../../SectionHeader';
import Button from '../../Button';
import { ConfirmationModal } from './ConfirmationModal';
import { useContext, useEffect, useState } from 'react';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';
import { DeviceContext } from '../../../context/DeviceContext';
import { useBackupProgress } from '../../../hooks/backups/useBackupProgress';

export function DeleteBackups() {
  const { backups, deleteBackups, backupStatus } = useContext(BackupContext);
  const { selected, current } = useContext(DeviceContext);
  const [askConfirmation, setAskConfirmation] = useState(false);

  const { thereIsProgress } = useBackupProgress();
  const { thereIsDownloadProgress } = useContext(BackupContext);

  const { translate } = useTranslationContext();

  const isDeleteDisabled = backups.length === 0 || backupStatus !== 'STANDBY' || thereIsDownloadProgress;

  function toggleConfirmation() {
    setAskConfirmation(!askConfirmation);
  }

  useEffect(() => {
    if (thereIsProgress || thereIsDownloadProgress) {
      setAskConfirmation(false);
    }
  }, [thereIsProgress, thereIsDownloadProgress]);

  async function deleteBackupsFromDevice() {
    deleteBackups(selected!, selected === current);
    toggleConfirmation();
  }

  return (
    <section>
      <SectionHeader>{translate('settings.backups.delete.title')}</SectionHeader>
      <SecondaryText className="mb-2">{translate('settings.backups.delete.explanation')}</SecondaryText>
      <Button variant="secondary" onClick={toggleConfirmation} disabled={isDeleteDisabled}>
        {translate('settings.backups.delete.action')}
      </Button>
      <ConfirmationModal
        show={askConfirmation}
        onCanceled={toggleConfirmation}
        onConfirmed={deleteBackupsFromDevice}
        title={translate('settings.backups.delete.deletion-modal.title')}
        explanation={translate('settings.backups.delete.deletion-modal.explanation')}
        explanation2={translate('settings.backups.delete.deletion-modal.explanation-2')}
        cancelText={translate('settings.backups.delete.deletion-modal.cancel')}
        confirmText={translate('settings.backups.delete.deletion-modal.confirm')}
      />
    </section>
  );
}
