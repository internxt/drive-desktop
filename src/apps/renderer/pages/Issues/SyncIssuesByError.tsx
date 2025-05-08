import { useTranslationContext } from '../../context/LocalContext';
import { useState } from 'react';
import { Accordion } from './Accordion';
import { shortMessages } from '../../messages/process-error';
import { Issue } from '@/apps/main/background-processes/issues';

function groupAppIssuesByErrorName(issues: Issue[]) {
  return issues.reduce(
    (acc, issue) => {
      const key = issue.error;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(issue);

      return acc;
    },
    {} as Record<Issue['error'], Issue[]>,
  );
}

type VirtualDriveIssuesByErrorAccordionProps = {
  readonly issues: Array<Issue>;
};

export function SyncIssuesByError({ issues }: VirtualDriveIssuesByErrorAccordionProps) {
  const { translate } = useTranslationContext();
  const [selected, setSelected] = useState<Issue['error'] | null>(null);

  const issuesByCauseArray = groupAppIssuesByErrorName(issues);

  const isSelected = (cause: Issue['error']) => {
    return cause === selected;
  };

  const toggleOrSelectCause = (clickedCause: Issue['error']) => () => {
    if (clickedCause === selected) {
      setSelected(null);
    } else {
      setSelected(clickedCause);
    }
  };

  return (
    <ul>
      {Object.entries(issuesByCauseArray).map(([rawError, issues]) => {
        const error = rawError as Issue['error'];

        return (
          <li className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5" onClick={toggleOrSelectCause(error)} key={error} role="button">
            <Accordion
              title={translate(shortMessages[error])}
              collapsed={!isSelected(error)}
              elements={issues.map((issue) => issue.name)}
            />
          </li>
        );
      })}
    </ul>
  );
}
