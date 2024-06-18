import { useTranslationContext } from '../../context/LocalContext';
import { useLastBackup } from '../../hooks/backups/useLastBackup';

export function LastBackupMade() {
  const { translate } = useTranslationContext();
  const { lastBackupTimestamp, fromNow } = useLastBackup();

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
