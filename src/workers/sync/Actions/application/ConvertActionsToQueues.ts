import { ItemKind } from '../../../../shared/ItemKind';
import { Action } from '../domain/Action';
import { ActionsQueue } from '../domain/ActionsQueues';

export type QeuesByItemKind = {
	file: {
		renameInLocal: Array<[string, string]>;
		renameInRemote: Array<[string, string]>;
		pullFromLocal: Array<string>;
		pullFromRemote: Array<string>;
		deleteInLocal: Array<string>;
		deleteInRemote: Array<string>;
	};
	folder: {
		renameInLocal: Array<[string, string]>;
		renameInRemote: Array<[string, string]>;
		pullFromLocal: Array<string>;
		pullFromRemote: Array<string>;
		deleteInLocal: Array<string>;
		deleteInRemote: Array<string>;
	};
};

const filterQueueForItemKind =
	<K extends ItemKind>(kind: K) =>
	(actions: Array<Action<ItemKind>>): ActionsQueue<K> => {
		const isItemKind = (action: Action<ItemKind>) => action.kind === kind;

		const pullFromLocal: Action<K>[] = actions.filter(
			(action) => isItemKind(action) && action.task === 'PULL' && action.fileSystem === 'LOCAL'
		) as Array<Action<K>>;

		const pullFromRemote: Action<K>[] = actions.filter(
			(action) => isItemKind(action) && action.task === 'PULL' && action.fileSystem === 'REMOTE'
		) as Array<Action<K>>;

		const deleteInLocal: Action<K>[] = actions.filter(
			(action) => isItemKind(action) && action.task === 'DELETE' && action.fileSystem === 'LOCAL'
		) as Array<Action<K>>;

		const deleteInRemote: Action<K>[] = actions.filter(
			(action) => isItemKind(action) && action.task === 'DELETE' && action.fileSystem === 'REMOTE'
		) as Array<Action<K>>;

		return {
			kind,
			renameInLocal: [],
			renameInRemote: [],
			pullFromLocal,
			pullFromRemote,
			deleteInLocal,
			deleteInRemote,
		};
	};

function extractNamesFromActionsQueues(queue: ActionsQueue<ItemKind>): {
	renameInLocal: Array<[string, string]>;
	renameInRemote: Array<[string, string]>;
	pullFromLocal: Array<string>;
	pullFromRemote: Array<string>;
	deleteInLocal: Array<string>;
	deleteInRemote: Array<string>;
} {
	return {
		renameInLocal: [] as Array<[string, string]>,
		renameInRemote: [] as Array<[string, string]>,
		pullFromLocal: queue.pullFromLocal.map((action) => action.name),
		pullFromRemote: queue.pullFromRemote.map((action) => action.name),
		deleteInLocal: queue.deleteInLocal.map((action) => action.name),
		deleteInRemote: queue.deleteInRemote.map((action) => action.name),
	};
}

export function convertActionsToQueues(actions: Array<Action<'FILE' | 'FOLDER'>>): QeuesByItemKind {
	return {
		file: extractNamesFromActionsQueues(filterQueueForItemKind('FILE')(actions)),
		folder: extractNamesFromActionsQueues(filterQueueForItemKind('FOLDER')(actions)),
	};
}
