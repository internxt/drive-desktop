import type { User } from '../../../apps/main/types';
import type { StoredCredentials } from './constants';
import { retrieveMailBridgeCredentials } from './retrieve-mail-bridge-credentials';
import { storeCredentials } from './store-credentials';
import { generateRandomPassword } from './utils/generate-random-password';

export function getOrCreateMailBridgeCredentials(user: User) {
  const { data: stored, error } = getMailBridgeCredentials();
  if (error) return { data: undefined, error };
  if (stored) {
    return { data: stored, error: undefined };
  }

  return createMailBridgeCredentials(user);
}

function getMailBridgeCredentials() {
  return retrieveMailBridgeCredentials();
}

function createMailBridgeCredentials(user: User) {
  const credentials: StoredCredentials = { username: user.email, password: generateRandomPassword() };
  const { error } = storeCredentials(credentials);
  if (error) return { error, data: undefined };

  return { data: credentials, error: undefined };
}
