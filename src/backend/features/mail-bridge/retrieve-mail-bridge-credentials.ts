import { getMailBridgeCredentialsFromStore } from './get-mail-bridge-credentials-from-store';
import { mapStoredMailBridgeCredentials } from './mappers/map-stored-mail-bridge-credentials';
import { decryptMailBridgeCredentials } from './utils/decrypt-mail-bridge-credentials';

export function retrieveMailBridgeCredentials() {
  const { data: encryptedCredentials, error: storeError } = getMailBridgeCredentialsFromStore();
  if (storeError) return { data: undefined, error: storeError };
  if (!encryptedCredentials) return { data: undefined, error: undefined };

  const { data: credentials, error: decryptError } = decryptMailBridgeCredentials(encryptedCredentials);
  if (decryptError) return { data: undefined, error: decryptError };

  return mapStoredMailBridgeCredentials(credentials);
}
