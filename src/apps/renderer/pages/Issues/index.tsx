import { useEffect, useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import { useTranslationContext } from '../../context/LocalContext';
import useBackupErrors from '../../hooks/backups/useBackupErrors';
import { useGeneralIssues } from '../../hooks/GeneralIssues';
import IssuesAccordions from './IssuesAccordions';
import { IssuesTabs } from './IssuesTabs';
import { Section } from './Section';
import { useIssues } from '../../hooks/useIssues';

export default function IssuesPage() {
  const { translate } = useTranslationContext();
  const { issues } = useIssues();
  const { generalIssues } = useGeneralIssues();
  const { backupErrors } = useBackupErrors();

  const [activeSection, setActiveSection] = useState<Section>('virtualDrive');

  useEffect(() => {
    if (generalIssues.length) {
      setActiveSection('app');
      return;
    }
    if (issues.length) {
      setActiveSection('virtualDrive');
      return;
    }

    if (backupErrors.length) {
      setActiveSection('backups');
      return;
    }

    setActiveSection('app');
  }, [issues, generalIssues, backupErrors]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WindowTopBar title={translate('issues.title')} />

      <div className="draggable flex items-center justify-center py-2">
        <IssuesTabs active={activeSection} onChangeTab={setActiveSection} />
      </div>

      <IssuesAccordions
        selectedTab={activeSection}
        issues={{
          app: generalIssues,
          virtualDrive: issues,
          backups: backupErrors,
        }}
      />
    </div>
  );
}
