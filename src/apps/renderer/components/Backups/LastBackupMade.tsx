import { useContext } from 'react';
import { useTranslationContext } from '../../context/LocalContext';
import { BackupContext } from '../../context/BackupContext';
import { DeviceContext } from '../../context/DeviceContext';

export function LastBackupMade() {
  const { translate } = useTranslationContext();
  const { lastBackupTimestamp, fromNow } = useContext(BackupContext);
  const { selected, current } = useContext(DeviceContext);

  return (
    <>
      {lastBackupTimestamp !== -1 && (
        <span className="text-gray-60">
          {translate('settings.backups.action.last-run')}&nbsp;
          {fromNow(selected === current ? undefined : selected?.lastBackupAt)}
        </span>
      )}
    </>
  );
}
