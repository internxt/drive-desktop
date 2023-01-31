import { Action } from '../domain/Action';

export function convertActionsToQeues(actions: Array<Action>) {
  const renameInLocal: [string, string][] = [];
  const renameInRemote: [string, string][] = [];
  const pullFromLocal: string[] = actions
    .filter((action) => action.task === 'PULL' && action.fileSystem === 'LOCAL')
    .map((action) => action.name);
  const pullFromRemote: string[] = actions
    .filter(
      (action) => action.task === 'PULL' && action.fileSystem === 'REMOTE'
    )
    .map((action) => action.name);
  const deleteInLocal: string[] = actions
    .filter(
      (action) => action.task === 'DELETE' && action.fileSystem === 'LOCAL'
    )
    .map((action) => action.name);
  const deleteInRemote: string[] = actions
    .filter(
      (action) => action.task === 'DELETE' && action.fileSystem === 'REMOTE'
    )
    .map((action) => action.name);

  return {
    renameInLocal,
    renameInRemote,
    pullFromLocal,
    pullFromRemote,
    deleteInLocal,
    deleteInRemote,
  };
}
