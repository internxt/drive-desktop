import crypto from '../../../shared/infrastructure/crypt';

export class CryptoJsNameDecrypt {
  decryptName(name: string, folderId: string, encryptVersion: string): string | null {
    return crypto.decryptName(name, folderId, encryptVersion);
  }
}
