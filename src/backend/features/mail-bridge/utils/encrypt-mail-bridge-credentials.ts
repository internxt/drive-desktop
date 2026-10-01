import { safeStorage } from 'electron';
import type { MailBridgeClientCredentials } from '../constants';

export function encryptMailBridgeCredentials(credentials: MailBridgeClientCredentials) {
  if (!safeStorage.isEncryptionAvailable()) return { data: undefined, error: new Error('Secure credential storage is unavailable') };

  try {
    return { data: safeStorage.encryptString(JSON.stringify(credentials)).toString('base64'), error: undefined };
  } catch (error) {
    return { data: undefined, error: new Error('Could not encrypt Mail Bridge credentials', { cause: error }) };
  }
}
