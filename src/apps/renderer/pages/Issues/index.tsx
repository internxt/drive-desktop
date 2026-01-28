import WindowTopBar from '../../components/WindowTopBar';
import { IssuesTabs } from './IssuesTabs';
import { useIssues } from '../../hooks/useIssues';
import IssuesAccordions from './IssuesAccordions';
import { useI18n } from '../../localize/use-i18n';
import { Section, useIssuesStore } from './issues-store';

type Props = {
  activeSection: Section;
};

export function IssuesPage({ activeSection }: Props) {
  const { translate } = useI18n();
  const { setActiveSection } = useIssuesStore();
  const { backupIssues, syncIssues, generalIssues } = useIssues();

  return (
    <div className="flex h-[484px] flex-col rounded bg-gray-1">
      <WindowTopBar title={translate('issues.title')} onClose={() => setActiveSection(null)} />

      <div className="flex items-center justify-center py-2">
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
