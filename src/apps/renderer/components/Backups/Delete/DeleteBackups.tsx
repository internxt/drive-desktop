import { SecondaryText } from '../../SecondaryText';
import { SectionHeader } from '../../SectionHeader';
import Button from '../../Button';
import { ConfirmationModal } from './ConfirmationModal';
import { useContext, useState } from 'react';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';

export function DeleteBackups() {
  const { backups, deleteBackup } = useContext(BackupContext);
  const [askConfirmation, setAskConfirmation] = useState(false);

  const { translate } = useTranslationContext();

  function toggleConfirmation() {
    setAskConfirmation(!askConfirmation);
  }

  async function deleteBackups() {
    const deletionPromises = backups.map((backup) => deleteBackup(backup));

    await Promise.all(deletionPromises);
    toggleConfirmation();
  }

  return (
    <section>
      <SectionHeader>
        {translate('settings.backups.delete.title')}
      </SectionHeader>
      <SecondaryText className="mb-2">
        {translate('settings.backups.delete.explanation')}
      </SecondaryText>
      <Button
        variant="secondary"
        onClick={toggleConfirmation}
        disabled={backups.length === 0}
      >
        {translate('settings.backups.delete.action')}
      </Button>
      <ConfirmationModal
        show={askConfirmation}
        onCanceled={toggleConfirmation}
        onConfirmed={deleteBackups}
      />
    </section>
  );
}
