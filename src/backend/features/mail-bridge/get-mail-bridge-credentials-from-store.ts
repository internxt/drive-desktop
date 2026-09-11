import { safeStorage } from 'electron';
import electronStore from '../../../apps/main/config';

export function getMailBridgeCredentialsFromStore() {
  const encrypted = electronStore.get('mailBridgeCredentials');
  if (!encrypted) return { data: undefined, error: undefined };
  if (!safeStorage.isEncryptionAvailable()) return { data: undefined, error: new Error('Secure credential storage is unavailable') };
  return { data: encrypted, error: undefined };
}
