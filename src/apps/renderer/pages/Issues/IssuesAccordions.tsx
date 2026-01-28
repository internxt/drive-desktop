import { IssuesByError } from './IssuesByError';
import { NoIssues } from './NoIssues';
import { Section } from './Section';
import { BackupsIssue, SyncIssue, GeneralIssue } from '@/apps/main/background-processes/issues';

type IssuesAccordionsProps = {
  selectedTab: Section;
  issues: {
    app: GeneralIssue[];
    virtualDrive: SyncIssue[];
    backups: BackupsIssue[];
  };
};

export default function IssuesAccordions({ selectedTab, issues }: IssuesAccordionsProps) {
  return (
    <ul className="relative m-5 mt-2 flex flex-1 flex-col divide-y divide-gray-5 overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm">
      {issues[selectedTab].length === 0 ? <NoIssues /> : null}
      {selectedTab === 'virtualDrive' && <IssuesByError issues={issues.virtualDrive} />}
      {selectedTab === 'app' && <IssuesByError issues={issues.app} />}
      {selectedTab === 'backups' && <IssuesByError issues={issues.backups} />}
    </ul>
  );
}
