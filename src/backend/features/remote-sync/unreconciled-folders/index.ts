import { clearStore } from './store';

export { addUnreconciledFolder } from './services/add-unreconciled-folder';
export { isInsideUnreconciledFolder } from './services/is-inside-unreconciled-folder';
export { removeUnreconciledFolder } from './services/remove-unreconciled-folder';

export function onLogout() {
  clearStore();
}
