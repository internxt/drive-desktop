import { useEffect, useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupFatalErrors from '../../hooks/BackupFatalErrors';
import useGeneralIssues from '../../hooks/GeneralIssues';
import useVirtualDriveIssues from '../../hooks/ProcessIssues';
import IssuesAccordions from './IssuesAccordions';
import { IssuesTabs } from './IssuesTabs';
import { Section } from './Section';

export default function IssuesPage() {
  const { translate } = useTranslationContext();
  const virtualDriveIssues = useVirtualDriveIssues();
  const appIssues = useGeneralIssues();
  const { backupFatalErrors } = useBackupFatalErrors();

  const [activeSection, setActiveSection] = useState<Section>('virtualDrive');

  useEffect(() => {
    if (activeSection === 'virtualDrive' && appIssues.length > 0) {
      setActiveSection('app');
    } else if (
      backupFatalErrors.length === 0 &&
      virtualDriveIssues.length > 0
    ) {
      setActiveSection('virtualDrive');
    }
  }, [virtualDriveIssues, appIssues]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WindowTopBar title={translate('issues.title')} />

      <div className="draggable flex items-center justify-center py-2">
        <IssuesTabs active={activeSection} onChangeTab={setActiveSection} />
      </div>

      <IssuesAccordions
        selectedTab={activeSection}
        issues={{ app: appIssues, virtualDrive: virtualDriveIssues }}
      />
    </div>
  );
}
