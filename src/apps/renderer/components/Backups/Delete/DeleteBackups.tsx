import { SecondaryText } from '../../SecondaryText';
import { SectionHeader } from '../../SectionHeader';
import Button from '../../Button';
import { ConfirmationModal } from './ConfirmationModal';
import { useContext, useState } from 'react';
import { useTranslationContext } from '../../../context/LocalContext';
import { BackupContext } from '../../../context/BackupContext';
import { DeviceContext } from '../../../context/DeviceContext';

export function DeleteBackups() {
  const { backups, deleteBackups } = useContext(BackupContext);
  const { selected, current } = useContext(DeviceContext);
  const [askConfirmation, setAskConfirmation] = useState(false);

  const { translate } = useTranslationContext();

  function toggleConfirmation() {
    setAskConfirmation(!askConfirmation);
  }

  async function deleteBackupsFromDevice() {
    await deleteBackups(selected!, selected === current);
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
        onConfirmed={deleteBackupsFromDevice}
      />
    </section>
  );
}
