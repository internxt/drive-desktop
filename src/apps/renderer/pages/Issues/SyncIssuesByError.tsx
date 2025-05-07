import { useTranslationContext } from '../../context/LocalContext';
import { getBaseName } from '../../utils/path';
import { useState } from 'react';
import { Accordion } from './Accordion';
import { VirtualDriveIssue } from '../../../shared/issues/VirtualDriveIssue';
import { SyncError } from '../../../shared/issues/SyncErrorCause';
import { shortMessages } from '../../messages/process-error';
import { ProcessIssue } from '@/apps/shared/types';

function groupAppIssuesByErrorName(issues: ProcessIssue[]) {
  const appIssuesGroupedByErrorName = issues.reduce(
    (acc, current) => {
      const key = current.action;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push({ cause: key, error: current.errorName, name: current.name });

      return acc;
    },
    {} as Record<ProcessIssue['action'], VirtualDriveIssue[]>,
  );

  return Object.entries(appIssuesGroupedByErrorName) as Array<[SyncError, Array<VirtualDriveIssue>]>;
}

type VirtualDriveIssuesByErrorAccordionProps = {
  readonly issues: Array<ProcessIssue>;
};

export function SyncIssuesByError({ issues }: VirtualDriveIssuesByErrorAccordionProps) {
  const { translate } = useTranslationContext();
  const [selected, setSelected] = useState<SyncError | null>(null);

  const issuesByCauseArray = groupAppIssuesByErrorName(issues);

  const isSelected = (cause: SyncError) => {
    return cause === selected;
  };

  const toggleOrSelectCause = (clickedCause: SyncError) => () => {
    if (clickedCause === selected) {
      setSelected(null);
      return;
    }

    setSelected(clickedCause);
  };

  return (
    <ul>
      {issuesByCauseArray.map(([cause, issues]) => (
        <li className="flex flex-col space-y-2.5 p-3 hover:bg-gray-5" onClick={toggleOrSelectCause(cause)} key={cause} role="button">
          <Accordion
            title={translate(shortMessages[cause])}
            collapsed={!isSelected(cause)}
            elements={issues.map((issue) => getBaseName(issue.name))}
          />
        </li>
      ))}
    </ul>
  );
}
