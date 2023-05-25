import { ItemKind } from '../../../../shared/ItemKind';
import { Action } from './Action';

export type ActionsQueue<T extends ItemKind> = {
	kind: T;
	renameInLocal: Array<Action<T>>;
	renameInRemote: Array<Action<T>>;
	pullFromLocal: Array<Action<T>>;
	pullFromRemote: Array<Action<T>>;
	deleteInLocal: Array<Action<T>>;
	deleteInRemote: Array<Action<T>>;
};
