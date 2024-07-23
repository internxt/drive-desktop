import useUsage from '../../hooks/useUsage';
import { SizePill } from './SizePill';
import { useContext, useEffect } from 'react';
import { useBackupProgress } from '../../hooks/backups/useBackupProgress';
import useBackupStatus from '../../hooks/backups/useBackupsStatus';
import { BackupsProgressBar } from './BackupsProgressBar';
import { BackupsProgressPercentage } from './BackupsProgressPercent';
import { ArrowCircleUp } from 'phosphor-react';
import { LastBackupMade } from './LastBackupMade';
import { ShowBackupsIssues } from './ShowBackupsIssues';
import { useBackups } from '../../hooks/backups/useBackups';
import { ActualDeviceContext } from '../../context/ActualDeviceContext';
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

export function DetailedDevicePill({
  showIssues,
}: DetailedDevicePillProps) {
  const { usage } = useUsage();
  const { backupStatus } = useBackupStatus();
  const { backups } = useBackups();
  const { thereIsProgress, percentualProgress, clearProgress } =
    useBackupProgress();
  const { current, selected } = useContext(ActualDeviceContext);
  const { lastBackupHadIssues } = useContext(BackupContext);

  useEffect(() => {
    if (backupStatus === 'STANDBY') {
      clearProgress();
    }
  }, [backupStatus]);

  const displayIssues = backups.length !== 0 && lastBackupHadIssues;

  return (
    <div className="rounded-lg  border border-gray-10 bg-surface px-6 py-4 shadow-sm dark:bg-gray-5">
      <div className="flex w-full items-center">
        <div className="grow">
          {selected?.name}
          <br />
          {thereIsProgress ? <BackingUp /> : <LastBackupMade />}
        </div>
        {thereIsProgress ? (
          <BackupsProgressPercentage progress={percentualProgress} />
        ) : (
          <SizePill size={usage?.limitInBytes ?? 0} />
        )}
      </div>
      {thereIsProgress && (
        <BackupsProgressBar progress={percentualProgress} />
      )}
      {selected === current && displayIssues && <ShowBackupsIssues show={showIssues} />}
    </div>
  );
}
