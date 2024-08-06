import { useContext } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { BackupContext } from '../../context/BackupContext';

export function LastBackupMade() {
  const { translate } = useTranslationContext();
  const { lastBackupTimestamp, fromNow } = useContext(BackupContext);

  return (
    <>
      {lastBackupTimestamp !== -1 && (
        <span className="text-gray-60">
          {translate('settings.backups.action.last-run')}&nbsp;
          {fromNow()}
        </span>
      )}
    </>
  );
}
