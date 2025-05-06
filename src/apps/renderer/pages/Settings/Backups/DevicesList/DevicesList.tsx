import { HTMLAttributes, useContext } from 'react';
import { DeviceContext } from '../../../../context/DeviceContext';
import { ScrollableContent } from '../../../../components/ScrollableContent';
import DevicePill from './DevicePill';
import Help from './Help';
import { useTranslationContext } from '../../../../context/LocalContext';

type DevicesSideBarProps = HTMLAttributes<HTMLBaseElement>;

export function DevicesList({ className }: DevicesSideBarProps) {
  const { translate } = useTranslationContext();
  const { devices, deviceState, current, selected, setSelected } =
    useContext(DeviceContext);

  const devicesWithoutCurrent = devices.filter(
    (device) =>
      deviceState.status === 'SUCCESS' && device.id !== deviceState.device.id
  );

  return (
    <aside className={className}>
      <div className="flex grow-0 flex-col">
        <h1 className="bg-gray-1">{translate('settings.backups.devices')}</h1>
        <ScrollableContent height={409} maxHeight={409} className="-mr-3">
          <ul>
            {current && (
              <li>
                <DevicePill
                  current
                  device={current}
                  selected={current === selected}
                  setSelected={setSelected}
                />
              </li>
            )}
            {devicesWithoutCurrent.map((device) => (
              <li className="my-1" key={device.id}>
                <DevicePill
                  device={device}
                  selected={device === selected}
                  setSelected={setSelected}
                />
              </li>
            ))}
          </ul>
        </ScrollableContent>
        <Help />
      </div>
    </aside>
  );
}
