import { electronStore } from '../config';
import { broadcastToWindows } from '../windows';

export function getLanguage() {
  return electronStore.get('preferedLanguage');
}

export function broadcastLanguage() {
  broadcastToWindows({ name: 'preferedLanguage-updated', data: getLanguage() });
}
