import { DetailedDevicePill } from '../../../components/Backups/DetailedDevicePill';
import { DeleteBackups } from '../../../components/Backups/Delete/DeleteBackups';
import { SelectedFoldersSection } from './SelectedFoldersSection';
import { Frequency } from './Frequency';
import { StartBackup } from './StartBackup';
import { ViewBackups } from './ViewBackups';
import { useContext } from 'react';
import { ActualDeviceContext } from '../../../context/ActualDeviceContext';
import { DownloadBackup } from './DownloadBackup';

interface DeviceBackupsProps {
  onGoToList: () => void;
}

export function DeviceBackups({ onGoToList }: DeviceBackupsProps) {
  const { current, selected } = useContext(ActualDeviceContext);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-neutral-500">Backup</p>
      <DetailedDevicePill showIssues={onGoToList} />
      <div className="grid grid-cols-2 gap-2">
        { selected === current ? <>
          <StartBackup className="w-full" />
          <DownloadBackup className="w-full" />
        </> : <>
          <DownloadBackup className="w-full" />
          <ViewBackups className="w-full" />
        </>}
      </div>
      { selected === current && <SelectedFoldersSection className="mt-2" onGoToList={onGoToList} />}
      { selected === current && <Frequency /> }
      { selected === current && <DeleteBackups /> }
    </div>
  );
}
