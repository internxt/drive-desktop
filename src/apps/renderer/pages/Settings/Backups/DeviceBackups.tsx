import { useContext } from 'react';
import { DeleteBackups } from '../../../components/Backups/Delete/DeleteBackups';
import { DetailedDevicePill } from '../../../components/Backups/DetailedDevicePill';
import { DeviceContext } from '../../../context/DeviceContext';
import { DownloadBackups } from './DownloadBackups';
import { Frequency } from './Frequency';
import { SelectedFoldersSection } from './SelectedFoldersSection';
import { StartBackup } from './StartBackup';
import { ViewBackups } from './ViewBackups';

interface DeviceBackupsProps {
  onGoToList: () => void;
  showDownloadFolders: () => void;
}

export function DeviceBackups({ onGoToList, showDownloadFolders }: DeviceBackupsProps) {
  const { current, selected } = useContext(DeviceContext);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-neutral-500">Backup</p>
      <DetailedDevicePill />
      <div className="grid grid-cols-2 gap-2">
        {selected === current ? (
          <>
            <StartBackup className="w-full" />
            <DownloadBackups className="w-full" />
          </>
        ) : (
          <>
            <DownloadBackups className="w-full" />
            <ViewBackups className="w-full" showDownloadFolders={showDownloadFolders} />
          </>
        )}
      </div>
      {selected === current && <SelectedFoldersSection className="mt-2" onGoToList={onGoToList} />}
      {selected === current && <Frequency />}
      <DeleteBackups />
    </div>
  );
}
