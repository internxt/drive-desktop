import { useState } from 'react';

import { GeneralIssue, GeneralIssueError } from '../../../main/background-processes/issues';

import GeneralIssueAccordion from '../Issues/GeneralIssueAccordion';

type AppIssueElementProps = {
  issues: Array<GeneralIssue>;
};
/*
 * v2.5.3 Alexis Mora
 * This function has to be here because it we add it to issues
 * the app tries to import it from the main process
 * which is not possible
 * */
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
    {} as Record<GeneralIssueError, GeneralIssue[]>,
  );

  return Object.entries(generalIssuesGroupedByError) as Array<[GeneralIssueError, Array<GeneralIssue>]>;
}

export function GeneralIssuesByErrorAccordion({ issues }: AppIssueElementProps) {
  const [selected, setSelected] = useState<GeneralIssueError | null>(null);

  const issuesByErrorNameArray = groupGeneralIssuesByErrorName(issues);

  const isSelected = (errorName: GeneralIssueError) => {
    return errorName === selected;
  };

  const toggleOrSelectError = (clickedError: GeneralIssueError) => () => {
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
