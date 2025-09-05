import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';
import { obtainToken } from './service';

export const HEADERS = {
  'content-type': 'application/json',
  'internxt-client': INTERNXT_CLIENT,
  'internxt-version': INTERNXT_VERSION,
  'x-internxt-desktop-header': process.env.DESKTOP_HEADER,
};

export function getAuthHeaders(): Record<string, string> {
  const token = obtainToken();

  return {
    Authorization: `Bearer ${token}`,
    ...HEADERS,
  };
}
