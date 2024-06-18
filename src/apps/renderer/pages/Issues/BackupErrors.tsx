import { useState } from 'react';
import { BackupErrorsCollection } from '../../../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';
import { useTranslationContext } from '../../context/LocalContext';
import { shortMessages } from '../../messages/virtual-drive-error';
import { Accordion } from './Accordion';
import { SyncError } from '../../../../shared/issues/SyncErrorCause';

interface BackupsErrorsProps {
  errors: BackupErrorsCollection;
}

export function BackupsIssues({ errors }: BackupsErrorsProps) {
  const { translate } = useTranslationContext();
  const [selected, setSelected] = useState<SyncError | null>(null);

  const isSelected = (cause: SyncError) => {
    return cause === selected;
  };

  const toggleOrSelectCause = (clickedCause: SyncError) => () => {
    if (clickedCause === selected) {
      setSelected(null);
      return;
    }

    setSelected(clickedCause);
  };

  return (
    <ul>
      {errors.map(({ name, error }) => (
        <li
          className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5"
          key={name}
          onClick={toggleOrSelectCause(error)}
        >
          <Accordion
            title={translate(shortMessages[error])}
            collapsed={!isSelected(error)}
            elements={[name]}
          />
        </li>
      ))}
    </ul>
  );
}
