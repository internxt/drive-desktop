import { AppIssue } from '../../../shared/issues/AppIssue';
import { GeneralIssuesByErrorAccordion } from './GeneralIssuesByErrorAccordion';
import { IssuesTab } from './IssuesTab';
import { NoIssues } from './NoIssues';
import { Section } from './Section';
import { BackupsIssue, SyncIssue } from '@/apps/main/background-processes/issues';

type IssuesAccordionsProps = {
  selectedTab: Section;
  issues: {
    app: AppIssue[];
    virtualDrive: SyncIssue[];
    backups: BackupsIssue[];
  };
};

export default function IssuesAccordions({ selectedTab, issues }: IssuesAccordionsProps) {
  return (
    <ul className="relative m-5 mt-2 flex flex-1 flex-col divide-y divide-gray-5 overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm">
      {issues[selectedTab].length === 0 ? <NoIssues /> : null}
      {selectedTab === 'virtualDrive' && <IssuesTab issues={issues.virtualDrive} />}
      {selectedTab === 'app' && <GeneralIssuesByErrorAccordion issues={issues.app} />}
      {selectedTab === 'backups' && <IssuesTab issues={issues.backups} />}
    </ul>
  );
}
