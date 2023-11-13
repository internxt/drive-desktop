import { useEffect, useState } from 'react';

import { Process } from '../../shared/types/Process';
import { syncErrorActions } from '../actions/sync-error-actions';
import { FatalErrorActionMap } from '../actions/types';

const actionsMap: Record<Process, FatalErrorActionMap> = {
  SYNC: syncErrorActions,
};

export default function useFatalErrorActions(
  process: Process
): FatalErrorActionMap {
  const [actions, setActions] = useState<FatalErrorActionMap>(actionsMap.SYNC);

  useEffect(() => {
    setActions(actionsMap[process]);
  }, [process]);

  return actions;
}
