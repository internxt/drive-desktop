import { useEffect, useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import { IssuesTabs } from './IssuesTabs';
import { Section } from './Section';
import { useIssues } from '../../hooks/useIssues';
import IssuesAccordions from './IssuesAccordions';
import { useI18n } from '../../localize/use-i18n';

export default function IssuesPage() {
  const { translate } = useI18n();
  const { backupIssues, syncIssues, generalIssues } = useIssues();

  const [activeSection, setActiveSection] = useState<Section>('virtualDrive');

  useEffect(() => {
    if (generalIssues.length) {
      setActiveSection('app');
      return;
    }
    if (syncIssues.length) {
      setActiveSection('virtualDrive');
      return;
    }

    if (backupIssues.length) {
      setActiveSection('backups');
      return;
    }

    setActiveSection('app');
  }, [syncIssues, generalIssues, backupIssues]);

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
          virtualDrive: syncIssues,
          backups: backupIssues,
        }}
      />
    </div>
  );
}
