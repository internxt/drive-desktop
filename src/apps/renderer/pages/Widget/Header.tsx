import useBackupErrors from '../../hooks/backups/useBackupErrors';
import useGeneralIssues from '../../hooks/GeneralIssues';
import useVirtualDriveIssues from '../../hooks/ProcessIssues';
import { AccountSection } from './AccountSection';
import { ItemsSection } from './ItemsSection';

export default function Header() {
  const processIssues = useVirtualDriveIssues();
  const { generalIssues } = useGeneralIssues();
  const { backupErrors } = useBackupErrors();

  const numberOfIssues: number = processIssues.length + backupErrors.length + generalIssues.length;
  const numberOfIssuesDisplay = numberOfIssues > 99 ? '99+' : numberOfIssues;

  function onQuitClick() {
    window.electron.quit();
  }

  const handleOpenURL = async (URL: string) => {
    try {
      await window.electron.openUrl(URL);
    } catch (error) {
      window.electron.logger.error({
        msg: '[RENDERER] Failed to open URL from widget header',
        error,
      });
    }
  };

  return (
    <div className="flex h-14 shrink-0 items-center justify-between space-x-6 border-b border-b-gray-10 bg-gray-1 px-2.5 dark:bg-gray-5">
      <AccountSection />
      <ItemsSection
        numberOfIssues={numberOfIssues}
        numberOfIssuesDisplay={numberOfIssuesDisplay}
        onQuitClick={onQuitClick}
        onOpenURL={handleOpenURL}
      />
    </div>
  );
}
