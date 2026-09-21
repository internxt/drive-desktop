import { safeStorage } from 'electron';

export function decryptMailBridgeCredentials(encryptedCredentials: string) {
  if (!safeStorage.isEncryptionAvailable()) return { data: undefined, error: new Error('Secure credential storage is unavailable') };

  try {
    const parsed = JSON.parse(safeStorage.decryptString(Buffer.from(encryptedCredentials, 'base64')));
    return { data: parsed, error: undefined };
  } catch (error) {
    return { data: undefined, error: new Error('Could not decrypt Mail Bridge credentials', { cause: error }) };
  }
}
