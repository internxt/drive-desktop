import { useState } from 'react';
import { AppIssue, ProcessErrorName } from '../../../shared/types';
import { Issue } from './Issue';
import { NoIssues } from './NoIssues';
import { Section } from './Section';
import { AppErrorName } from '../../../../shared/issues/AppIssue';
import { VirtualDriveIssue } from '../../../../shared/issues/VirtualDriveIssue';
import { AppIssueElement } from './GeneralIssue';

type ProcessIssuesListProps = {
  selectedTab: Section;
  issues: {
    app: AppIssue[];
    virtualDrive: VirtualDriveIssue[];
  };
};

export default function ProcessIssuesList({
  selectedTab,
  issues,
}: ProcessIssuesListProps) {
  const [selectedErrorName, setSelectedErrorName] = useState<
    ProcessErrorName | AppErrorName | null
  >(null);

  const renderItems = () => {
    if (selectedTab === 'app') {
      return issues[selectedTab].map((issue) => {
        const error = issue.errorName;

        return (
          <AppIssueElement
            onClick={() =>
              selectedErrorName === error
                ? setSelectedErrorName(null)
                : setSelectedErrorName(error)
            }
            key={error}
            errorName={error}
            isSelected={selectedErrorName === error}
            issues={issues[selectedTab].filter((i) => i.errorName === error)}
          />
        );
      });
    }

    return issues[selectedTab].map((issue) => {
      const error = issue.errorName;
      return (
        <Issue
          key={error}
          onClick={() =>
            selectedErrorName === error
              ? setSelectedErrorName(null)
              : setSelectedErrorName(error)
          }
          errorName={error}
          issues={issues[selectedTab].filter((i) => i.errorName === error)}
          isSelected={selectedErrorName === error}
        />
      );
    });
  };

  return (
    <ul className="relative m-5 mt-2 flex flex-1 flex-col divide-y divide-gray-5 overflow-y-auto rounded-lg border border-gray-20 bg-surface shadow-sm">
      {issues[selectedTab].length === 0 ? <NoIssues /> : null}
      {renderItems()}
    </ul>
  );
}
