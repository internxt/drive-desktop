import { DetailedDevicePill } from '../../../components/Backups/DetailedDevicePill';
import { DeleteBackups } from '../../../components/Backups/Delete/DeleteBackups';
import { SelectedFoldersSection } from './SelectedFoldersSection';
import { Frequency } from './Frequency/Frequency';
import { StartBackup } from './StartBackup';
import { ViewBackups } from './ViewBackups';
import { useContext } from 'react';
import { DeviceContext } from '../../../context/DeviceContext';
import { DownloadBackups } from './DownloadBackups';
import { useTranslationContext } from '../../../context/LocalContext';

interface DeviceBackupsProps {
  onGoToList: () => void;
  showIssues: () => void;
}

export function DeviceBackups({ onGoToList, showIssues }: DeviceBackupsProps) {
  const { current, selected } = useContext(DeviceContext);
  const { translate } = useTranslationContext();
  return (
    <div className="flex flex-col gap-2">
      <p className="text-neutral-500">{translate('settings.backups.backup-name')}</p>
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
            <ViewBackups className="w-full" />
          </>
        )}
      </div>
      {selected === current && (
        <>
          <SelectedFoldersSection className="mt-2" onGoToList={onGoToList} />
          <Frequency />
        </>
      )}
      <DeleteBackups />
    </div>
  );
}
