import electronStore from '../../../apps/main/config';
import type { StoredCredentials } from './constants';
import { encryptMailBridgeCredentials } from './utils/encrypt-mail-bridge-credentials';

export function storeCredentials(credentials: StoredCredentials) {
  const { data: encryptedCredentials, error: encryptionError } = encryptMailBridgeCredentials(credentials);
  if (encryptionError) return { data: undefined, error: encryptionError };

  try {
    electronStore.set('mailBridgeCredentials', encryptedCredentials);
    return { data: encryptedCredentials, error: undefined };
  } catch (error) {
    return { data: undefined, error: new Error('Could not store Mail Bridge credentials', { cause: error }) };
  }
}
