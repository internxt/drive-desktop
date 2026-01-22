import useUsage from '../../hooks/useUsage';
import { SizePill } from './SizePill';
import { useContext, useEffect } from 'react';
import { useBackupProgress } from '../../hooks/backups/useBackupProgress';
import { BackupsProgressBar } from './BackupsProgressBar';
import { BackupsProgressPercentage } from './BackupsProgressPercent';
import { ArrowCircleDown, ArrowCircleUp } from 'phosphor-react';
import { LastBackupMade } from './LastBackupMade';
import { ShowBackupsIssues } from './ShowBackupsIssues';
import { DeviceContext } from '../../context/DeviceContext';
import { BackupContext } from '../../context/BackupContext';

interface DetailedDevicePillProps {
  showIssues: () => void;
}

function BackingUp() {
  return (
    <span className="flex flex-row items-center text-primary">
      <ArrowCircleUp className="mr-2 text-primary" /> Backing up...
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
  const { usage } = useUsage();
  const { percentualProgress, clearProgress } = useBackupProgress();
  const { current, selected } = useContext(DeviceContext);
  const { lastBackupHadIssues, backups, backupStatus, downloadProgress, thereIsDownloadProgress } =
    useContext(BackupContext);

  useEffect(() => {
    if (backupStatus === 'STANDBY') {
      clearProgress();
    }
  }, [backupStatus]);

  const displayIssues = backups.length !== 0 && lastBackupHadIssues;

  return (
    <div className="rounded-lg border border-gray-10 bg-surface px-6 py-4 shadow-sm dark:bg-gray-5">
      <div className="flex w-full items-center">
        <div className="grow">
          {selected?.name}
          <br />
          {selected === current && backupStatus === 'RUNNING' ? <BackingUp /> : <LastBackupMade />}
        </div>
        {selected === current && backupStatus === 'RUNNING' ? (
          <BackupsProgressPercentage progress={percentualProgress} />
        ) : (
          <SizePill size={usage?.limitInBytes ?? 0} />
        )}
      </div>
      {selected === current && backupStatus === 'RUNNING' && <BackupsProgressBar progress={percentualProgress} />}
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
