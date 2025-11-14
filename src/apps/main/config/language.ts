import { broadcastToWindows } from '../windows';
import { electronStore } from '../config';

export function getLanguage() {
  return electronStore.get('preferedLanguage');
}

export function broadcastLanguage() {
  broadcastToWindows({ name: 'preferedLanguage-updated', data: getLanguage() });
}
