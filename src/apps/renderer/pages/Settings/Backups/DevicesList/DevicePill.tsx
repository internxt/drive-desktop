import { Device } from '../../../../../main/device/service';
import { type FC } from 'react';
import { useTranslationContext } from '../../../../context/LocalContext';

interface DevicePillProps {
  device: Device;
  current?: boolean;
  selected?: boolean;
  setSelected: (device: Device) => void;
}

const DevicePill: FC<DevicePillProps> = ({
  device,
  current,
  selected,
  setSelected,
}) => {
  const { translate } = useTranslationContext();

  const borderStyle = selected
    ? 'rounded-lg border border-gray-10 bg-surface shadow-sm dark:bg-gray-5'
    : '';

  const styles = `${borderStyle} flex flex-col px-3 py-2 hover:cursor-pointer`;

  return (
    <div
      className={styles}
      onClick={() => setSelected(device)}
      data-testid={`device-pill-${device.id}`}
    >
      {current && (
        <div className="text-xs text-primary">
          {translate('settings.backups.this-device')}
        </div>
      )}
      {device.name}
    </div>
  );
};

export default DevicePill;
