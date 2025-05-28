import { useTranslationContext } from '../../context/LocalContext';
import { useState } from 'react';
import { Accordion } from './Accordion';
import { shortMessages } from '../../messages/process-error';
import { SyncIssue } from '@/apps/main/background-processes/issues';

function groupAppIssuesByErrorName(issues: SyncIssue[]) {
  return issues.reduce(
    (acc, issue) => {
      const key = issue.error;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(issue);

      return acc;
    },
    {} as Record<SyncIssue['error'], SyncIssue[]>,
  );
}

type VirtualDriveIssuesByErrorAccordionProps = {
  readonly issues: Array<SyncIssue>;
};

export function SyncIssuesByError({ issues }: VirtualDriveIssuesByErrorAccordionProps) {
  const { translate } = useTranslationContext();
  const [selected, setSelected] = useState<SyncIssue['error'] | null>(null);

  const issuesByCauseArray = groupAppIssuesByErrorName(issues);

  const isSelected = (cause: SyncIssue['error']) => {
    return cause === selected;
  };

  const toggleOrSelectCause = (clickedCause: SyncIssue['error']) => () => {
    if (clickedCause === selected) {
      setSelected(null);
    } else {
      setSelected(clickedCause);
    }
  };

  return (
    <ul>
      {Object.entries(issuesByCauseArray).map(([rawError, issues]) => {
        const error = rawError as SyncIssue['error'];

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
