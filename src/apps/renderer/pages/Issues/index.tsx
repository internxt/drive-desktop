import { useEffect, useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import { useTranslationContext } from '../../context/LocalContext';
import { IssuesTabs } from './IssuesTabs';
import { Section } from './Section';
import { useIssues } from '../../hooks/useIssues';
import IssuesAccordions from './IssuesAccordions';

export default function IssuesPage() {
  const { translate } = useTranslationContext();
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
          backups: backupIssues as any,
        }}
      />
    </div>
  );
}
