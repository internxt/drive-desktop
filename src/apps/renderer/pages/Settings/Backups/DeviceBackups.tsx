import { Device } from '../../../../main/device/service';
import { DetailedDevicePill } from '../../../components/Backups/DetailedDevicePill';
import { DeleteBackups } from '../../../components/Backups/Delete/DeleteBackups';
import { SelectedFoldersSection } from './SelectedFoldersSection';
import { Frequency } from './Frequency';
import { StartBackup } from './StartBackup';
import { ViewBackups } from './ViewBackups';

interface DeviceBackupsProps {
  device: Device;
  onGoToList: () => void;
}

export function DeviceBackups({ device, onGoToList }: DeviceBackupsProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-neutral-500">Backup</p>
      <DetailedDevicePill device={device} showIssues={onGoToList} />
      <div className="grid grid-cols-2 gap-2">
        <StartBackup className="w-full" />
        <ViewBackups className="w-full" />
      </div>
      <SelectedFoldersSection className="mt-2" onGoToList={onGoToList} />
      <Frequency />
      <DeleteBackups />
    </div>
  );
}
