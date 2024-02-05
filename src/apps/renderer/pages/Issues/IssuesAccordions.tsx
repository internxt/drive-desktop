import { SyncIssuesByErrorAccordion } from './SyncIssuesByErrorAccordion';
import { NoIssues } from './NoIssues';
import { Section } from './Section';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';
import { GeneralIssuesByErrorAccordion } from './GeneralIssuesByErrorAccordion';

import { AppIssue } from '../../../../shared/issues/AppIssue';

type IssuesAccordionsProps = {
  selectedTab: Section;
  issues: {
    app: AppIssue[];
    virtualDrive: VirtualDriveIssue[];
  };
};

export default function IssuesAccordions({
  selectedTab,
  issues,
}: IssuesAccordionsProps) {
  return (
    <ul className="relative m-5 mt-2 flex flex-1 flex-col divide-y divide-gray-5 overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm">
      {issues[selectedTab].length === 0 ? <NoIssues /> : null}
      {selectedTab === 'virtualDrive' && (
        <SyncIssuesByErrorAccordion issues={issues.virtualDrive} />
      )}
      {selectedTab === 'app' && (
        <GeneralIssuesByErrorAccordion issues={issues.app} />
      )}
    </ul>
  );
}
