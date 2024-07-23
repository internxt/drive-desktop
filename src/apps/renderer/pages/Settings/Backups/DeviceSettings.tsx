import { useBackupsEnabled } from '../../../hooks/backups/useBackupsEnabled';
import { EnableBackups } from './EnableBackups';
import { DeviceBackups } from './DeviceBackups';
import { useContext } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';

interface DeviceSettingsProps extends React.HTMLAttributes<HTMLBaseElement> {
  onGoToList: () => void;
}

export function DeviceSettings({ onGoToList, className }: DeviceSettingsProps) {
  const { enabled, toggleEnabled } = useBackupsEnabled();

  const { deviceState } = useContext(DeviceContext);

  return (
    <section className={className}>
      {!enabled || deviceState.status !== 'SUCCESS' ? (
        <EnableBackups enable={toggleEnabled} />
      ) : (
        <>
          <DeviceBackups onGoToList={onGoToList} />
        </>
      )}
    </section>
  );
}
