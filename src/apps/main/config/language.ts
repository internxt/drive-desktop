import { broadcastToWindows } from '../windows';
import { DEFAULT_LANGUAGE } from './language.types';
import { electronStore } from '../config';

export function getLanguage() {
  return electronStore.get('preferedLanguage') || DEFAULT_LANGUAGE;
}

export function broadcastLanguage() {
  broadcastToWindows({ name: 'preferedLanguage-updated', data: getLanguage() });
}
