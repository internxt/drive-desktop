import { useContext } from 'react';
import { BackupContext } from '../../context/BackupContext';
import { DeviceContext } from '../../context/DeviceContext';
import { useI18n } from '../../localize/use-i18n';

export function LastBackupMade() {
  const { translate } = useI18n();
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
