import { BackupErrorsCollection } from '../../../main/background-processes/backups/BackupFatalErrors/BackupFatalErrors';
import { AppIssue } from '../../../shared/issues/AppIssue';
import { BackupsIssues } from './BackupErrors';
import { GeneralIssuesByErrorAccordion } from './GeneralIssuesByErrorAccordion';
import { NoIssues } from './NoIssues';
import { Section } from './Section';
import { SyncIssuesByError } from './SyncIssuesByError';
import { Issue } from '@/apps/main/background-processes/issues';

type IssuesAccordionsProps = {
  selectedTab: Section;
  issues: {
    app: AppIssue[];
    virtualDrive: Issue[];
    backups: BackupErrorsCollection;
  };
};

export default function IssuesAccordions({ selectedTab, issues }: IssuesAccordionsProps) {
  return (
    <ul className="relative m-5 mt-2 flex flex-1 flex-col divide-y divide-gray-5 overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm">
      {issues[selectedTab].length === 0 ? <NoIssues /> : null}
      {selectedTab === 'virtualDrive' && <SyncIssuesByError issues={issues.virtualDrive.filter((issue) => issue.tab === 'sync')} />}
      {selectedTab === 'app' && <GeneralIssuesByErrorAccordion issues={issues.app} />}
      {selectedTab === 'backups' && <BackupsIssues errors={issues.backups} />}
    </ul>
  );
}
