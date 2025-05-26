import { useEffect, useMemo, useState } from 'react';
import WindowTopBar from '../../components/WindowTopBar';
import { useTranslationContext } from '../../context/LocalContext';
import useGeneralIssues from '../../hooks/GeneralIssues';
import IssuesAccordions from './IssuesAccordions';
import { IssuesTabs } from './IssuesTabs';
import { Section } from './Section';
import { useIssues } from '../../hooks/useIssues';

export default function IssuesPage() {
  const { translate } = useTranslationContext();
  const { issues } = useIssues();
  const { generalIssues } = useGeneralIssues();

  const [activeSection, setActiveSection] = useState<Section>('virtualDrive');

  const parsedIssues = useMemo(() => {
    return {
      app: generalIssues,
      virtualDrive: issues.filter((issue) => issue.tab === 'sync'),
      backups: issues.filter((issue) => issue.tab === 'backups'),
    };
  }, [generalIssues, issues]);

  useEffect(() => {
    if (parsedIssues.app.length) {
      setActiveSection('app');
    } else if (parsedIssues.virtualDrive.length) {
      setActiveSection('virtualDrive');
    } else if (parsedIssues.backups.length) {
      setActiveSection('backups');
    } else {
      setActiveSection('app');
    }
  }, [parsedIssues]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <WindowTopBar title={translate('issues.title')} />

      <div className="draggable flex items-center justify-center py-2">
        <IssuesTabs active={activeSection} onChangeTab={setActiveSection} />
      </div>

      <IssuesAccordions selectedTab={activeSection} issues={parsedIssues} />
    </div>
  );
}
