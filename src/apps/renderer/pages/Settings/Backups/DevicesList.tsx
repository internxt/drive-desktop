import { useContext } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';
import { Question } from '@phosphor-icons/react';
import { useDevices } from '../../../hooks/devices/useDevices';
import { Device } from '../../../../main/device/service';
import { ScrollableContent } from '../../../components/ScrollableContent';

interface DevicePillProps {
  device: Device;
  current?: boolean;
  selected?: boolean;
  setSelected: (device: Device) => void;
}

function DevicePill({ device, current, selected, setSelected }: DevicePillProps) {
  const borderStyle = selected ? 'rounded-lg border border-gray-10 bg-surface shadow-sm dark:bg-gray-5' : '';

  const styles = `${borderStyle} flex flex-col px-3 py-2 hover:cursor-pointer`;

  return (
    <div className={styles} onClick={() => setSelected(device)}>
      {current && <div className="text-xs text-primary">This device</div>}
      {device.plainName}
    </div>
  );
}

function Help() {
  const handleOpenURL = async () => {
    try {
      await window.electron.shellOpenExternal('https://help.internxt.com/en/articles/6583477-how-do-backups-work-on-internxt-drive');
    } catch (error) {
      reportError(error);
    }
  };

  return (
    <div className="mt-auto hover:cursor-pointer" onClick={handleOpenURL}>
      <Question className="mr-1 inline" />
      <span className="text-gray-100">Help</span>
    </div>
  );
}

type DevicesSideBarProps = React.HTMLAttributes<HTMLBaseElement>;

export function DevicesList({ className }: DevicesSideBarProps) {
  const { deviceState, current, selected, setSelected } = useContext(DeviceContext);
  const { devices } = useDevices();

  const devicesWithoutCurrent = devices.filter((device) => deviceState.status === 'SUCCESS' && device.id !== deviceState.device.id);

  return (
    <aside className={className}>
      <div className="flex grow-0 flex-col">
        <h1 className="bg-gray-1">Devices</h1>
        <ScrollableContent height={409} maxHeight={409} className="-mr-3">
          <ul>
            {current && (
              <li>
                <DevicePill device={current} current selected={current === selected} setSelected={setSelected} />
              </li>
            )}
            {devicesWithoutCurrent.map((device) => (
              <li className="my-1" key={device.id}>
                {<DevicePill device={device} selected={device === selected} setSelected={setSelected} />}
              </li>
            ))}
          </ul>
        </ScrollableContent>
        <Help />
      </div>
    </aside>
  );
}
