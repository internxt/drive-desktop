import { broadcastToWindows } from '../windows';
import { getConfigKey } from '../config/service';
import { DEFAULT_LANGUAGE } from './language.types';

export function getLanguage() {
  return getConfigKey('preferedLanguage') || DEFAULT_LANGUAGE;
}

export function broadcastLanguage() {
  broadcastToWindows({ name: 'preferedLanguage-updated', data: getLanguage() });
}
