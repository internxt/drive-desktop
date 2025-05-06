import { useBackupsEnabled } from '../../../hooks/backups/useBackupsEnabled';
import { EnableBackups } from './EnableBackups';
import { DeviceBackups } from './DeviceBackups';
import { useContext } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';

interface DeviceSettingsProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
  showIssues: () => void;
}

export function DeviceSettings({ onGoToList, className, showIssues }: DeviceSettingsProps) {
  const { enabled, toggleEnabled } = useBackupsEnabled();

  const { deviceState } = useContext(DeviceContext);
  const { current, selected } = useContext(DeviceContext);
  const shouldShowEnableBackups = current === selected && (!enabled || deviceState.status !== 'SUCCESS');

  return (
    <section className={className}>
      {shouldShowEnableBackups ? (
        <EnableBackups enable={toggleEnabled} />
      ) : (
        <DeviceBackups onGoToList={onGoToList} showIssues={showIssues} />
      )}
    </section>
  );
}
