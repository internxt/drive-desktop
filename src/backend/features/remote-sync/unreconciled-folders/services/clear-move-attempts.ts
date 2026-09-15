import { store } from '../store';

export function clearMoveAttempts({ uuid }: { uuid: string }) {
  store.moves.delete(uuid);
}
