import { useContext, useEffect, useState } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';
import { Question } from '@phosphor-icons/react';
import { useDevices } from '../../../hooks/devices/useDevices';
import { Device } from '../../../../main/device/service';
import { ScrollableContent } from '../../../components/ScrollableContent';

interface DevicePillProps {
  device: Device;
  current?: boolean;
}

function DevicePill({ device, current }: DevicePillProps) {
  const borderStyle = current
    ? 'rounded-lg border border-gray-10 bg-surface shadow-sm dark:bg-gray-5'
    : '';

  const styles = `${borderStyle} flex flex-col px-3 py-2 `;

  return (
    <div className={styles}>
      {current && <div className="text-xs text-primary">This device</div>}
      {device.name}
    </div>
  );
}

function Help() {
  const handleOpenURL = async () => {
    try {
      await window.electron.openUrl(
        'https://help.internxt.com/en/articles/6583477-how-do-backups-work-on-internxt-drive'
      );
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="mt-auto hover:cursor-pointer" onClick={handleOpenURL}>
      <Question className="mr-1 inline" />
      <span className="text-gray-100">Backups help</span>
    </div>
  );
}

type DevicesSideBarProps = React.HTMLAttributes<HTMLBaseElement>;

export function DevicesList({ className }: DevicesSideBarProps) {
  const [state] = useContext(DeviceContext);
  const { devices } = useDevices();

  const [current, setCurrent] = useState<Device | undefined>();

  useEffect(() => {
    if (state.status !== 'SUCCESS') {
      setCurrent(undefined);
      return;
    }

    setCurrent(state.device);
  }, [state]);

  const devicesWithoutCurrent = devices.filter(
    (device) => state.status === 'SUCCESS' && device.id !== state.device.id
  );

  return (
    <aside className={className}>
      <div className="flex grow-0 flex-col">
        <h1 className="bg-gray-1">Devices</h1>
        <ScrollableContent maxHeight={409} className="-mr-3">
          <ul>
            {current && (
              <li>
                <DevicePill device={current} current />
              </li>
            )}
            {devicesWithoutCurrent.map((device) => (
              <li className="my-1" key={device.id}>
                {<DevicePill device={device} />}
              </li>
            ))}
          </ul>
        </ScrollableContent>
        <Help />
      </div>
    </aside>
  );
}
