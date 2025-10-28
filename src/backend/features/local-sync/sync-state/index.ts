import { clearStore } from './store';

export { addItem } from './services/add-item';

export function onLogout() {
  clearStore();
}
