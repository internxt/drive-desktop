import { DetailedDevicePill } from '../../../components/Backups/DetailedDevicePill';
import { DeleteBackups } from '../../../components/Backups/Delete/DeleteBackups';
import { SelectedFoldersSection } from './SelectedFoldersSection';
import { Frequency } from './Frequency';
import { StartBackup } from './StartBackup';
import { ViewBackups } from './ViewBackups';
import { useContext } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';
import { DownloadBackups } from './DownloadBackups';

interface DeviceBackupsProps {
  onGoToList: () => void;
  showIssues: () => void;
  showDownloadFolers: () => void;
}

export function DeviceBackups({
  onGoToList,
  showIssues,
  showDownloadFolers,
}: DeviceBackupsProps) {
  const { current, selected } = useContext(DeviceContext);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-neutral-500">Backup</p>
      <DetailedDevicePill showIssues={showIssues} />
      <div className="grid grid-cols-2 gap-2">
        {selected === current ? (
          <>
            <StartBackup className="w-full" />
            <DownloadBackups className="w-full" />
          </>
        ) : (
          <>
            <DownloadBackups className="w-full" />
            <ViewBackups
              className="w-full"
              showDownloadFolers={showDownloadFolers}
            />
          </>
        )}
      </div>
      {selected === current && (
        <SelectedFoldersSection className="mt-2" onGoToList={onGoToList} />
      )}
      {selected === current && <Frequency />}
      <DeleteBackups />
    </div>
  );
}
