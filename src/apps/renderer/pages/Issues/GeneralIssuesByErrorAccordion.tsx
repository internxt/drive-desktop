import { useState } from 'react';

import { GeneralIssue } from '../../../main/background-processes/issues';

import { GeneralIssueAccordion } from '../Issues/GeneralIssueAccordion';

type AppIssueElementProps = {
  issues: Array<GeneralIssue>;
};

export function groupGeneralIssuesByErrorName(issues: GeneralIssue[]) {
  const generalIssuesGroupedByError = issues.reduce(
    (acc, current) => {
      const key = current.error;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(current);

      return acc;
    },
    {} as Record<GeneralIssue['error'], GeneralIssue[]>,
  );

  return Object.entries(generalIssuesGroupedByError) as Array<[GeneralIssue['error'], Array<GeneralIssue>]>;
}

export function GeneralIssuesByErrorAccordion({ issues }: AppIssueElementProps) {
  const [selected, setSelected] = useState<GeneralIssue['error'] | null>(null);

  const issuesByErrorNameArray = groupGeneralIssuesByErrorName(issues);

  const isSelected = (errorName: GeneralIssue['error']) => {
    return errorName === selected;
  };

  const toggleOrSelectError = (clickedError: GeneralIssue['error']) => () => {
    setSelected(clickedError === selected ? null : clickedError);
  };

  return (
    <ul>
      {issuesByErrorNameArray.map(([errorName, issues]) => (
        <li className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5" onClick={toggleOrSelectError(errorName)} key={errorName}>
          <GeneralIssueAccordion extend={isSelected(errorName)} errorName={errorName} issues={issues} />
        </li>
      ))}
    </ul>
  );
}
