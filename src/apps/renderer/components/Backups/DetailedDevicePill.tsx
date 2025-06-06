import { useContext, useEffect } from 'react';
import { useBackupProgress } from '../../hooks/backups/useBackupProgress';
import { BackupsProgressBar } from './BackupsProgressBar';
import { BackupsProgressPercentage } from './BackupsProgressPercent';
import { ArrowCircleDown, ArrowCircleUp } from 'phosphor-react';
import { LastBackupMade } from './LastBackupMade';
import { ShowBackupsIssues } from './ShowBackupsIssues';
import { DeviceContext } from '../../context/DeviceContext';
import { BackupContext } from '../../context/BackupContext';
import { useIssues } from '../../hooks/useIssues';
import { BackupsStatus } from '@/apps/main/background-processes/backups/BackupsProcessStatus/BackupsStatus';

interface DetailedDevicePillProps {
  showIssues: () => void;
}

function BackingUp({ backupStatus }: { backupStatus: BackupsStatus }) {
  return (
    <span className="flex flex-row items-center text-primary">
      <ArrowCircleUp className="mr-2 text-primary" /> {backupStatus === 'STOPPING' ? 'Stopping backup...' : 'Backing up...'}
    </span>
  );
}

function DownloadingBackup() {
  return (
    <span className="flex flex-row items-center text-primary">
      <ArrowCircleDown className="mr-2 text-primary" /> Downloading Backup...
    </span>
  );
}

export function DetailedDevicePill({ showIssues }: DetailedDevicePillProps) {
  const { thereIsProgress, percentualProgress, clearProgress } = useBackupProgress();
  const { current, selected } = useContext(DeviceContext);
  const { backupStatus, downloadProgress, thereIsDownloadProgress } = useContext(BackupContext);
  const { backupIssues } = useIssues();

  useEffect(() => {
    if (backupStatus === 'STANDBY') {
      clearProgress();
    }
  }, [backupStatus]);

  const displayIssues = backupIssues.length > 0;

  return (
    <div className="rounded-lg  border border-gray-10 bg-surface px-6 py-4 shadow-sm dark:bg-gray-5">
      <div className="flex w-full items-center">
        <div className="grow">
          {selected?.name}
          <br />
          {selected?.id === current?.id && thereIsProgress ? <BackingUp backupStatus={backupStatus} /> : <LastBackupMade />}
        </div>
        {selected === current && thereIsProgress && <BackupsProgressPercentage progress={percentualProgress} />}
      </div>
      {selected === current && thereIsProgress && <BackupsProgressBar progress={percentualProgress} />}
      {selected === current && displayIssues && <ShowBackupsIssues show={showIssues} />}

      {thereIsDownloadProgress && (
        <>
          <div className="flex w-full items-center">
            <div className="grow">
              <DownloadingBackup />
            </div>
            <BackupsProgressPercentage progress={downloadProgress} />
          </div>
          <BackupsProgressBar progress={downloadProgress} />
        </>
      )}
    </div>
  );
}
