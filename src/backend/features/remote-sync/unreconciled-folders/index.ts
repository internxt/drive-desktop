import { clearStore } from './store';

export { MAX_MOVE_ATTEMPTS } from './defs';
export { addUnreconciledFolder } from './services/add-unreconciled-folder';
export { clearMoveAttempts } from './services/clear-move-attempts';
export { isInsideUnreconciledFolder } from './services/is-inside-unreconciled-folder';
export { removeUnreconciledFolder } from './services/remove-unreconciled-folder';
export { trackMoveAttempt } from './services/track-move-attempt';

export function onLogout() {
  clearStore();
}
