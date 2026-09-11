import type { StoredCredentials } from '../constants';

export function mapStoredMailBridgeCredentials(value: unknown) {
  if (!isStoredCredentials(value)) {
    return { data: undefined, error: new Error('Stored Mail Bridge credentials are invalid') };
  }

  return { data: value, error: undefined };
}

function isStoredCredentials(value: unknown): value is StoredCredentials {
  if (typeof value !== 'object' || value === null) return false;

  const credentials = value as Partial<StoredCredentials>;
  if (typeof credentials.username !== 'string' || typeof credentials.password !== 'string') return false;

  return true;
}
