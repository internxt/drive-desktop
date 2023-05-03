import { useEffect, useState } from 'react';

import { Process } from '../../shared/types/Process';
import { backupsErrorActions } from '../actions/backsups-error-actions';
import { syncErrorActions } from '../actions/sync-error-actions';
import { FatalErrorActionMap } from '../actions/types';

const actionsMap: Record<Process, FatalErrorActionMap> = {
	SYNC: syncErrorActions,
	BACKUPS: backupsErrorActions,
};

export default function useFatalErrorActions(process: Process): FatalErrorActionMap {
	const [actions, setActions] = useState<FatalErrorActionMap>(actionsMap.SYNC);

	useEffect(() => {
		setActions(actionsMap[process]);
	}, [process]);

	return actions;
}
