import crypto from '../../../shared/infrastructure/crypt';
import { NameDecrypt } from '../domain/NameDecrypt';

export class CryptoJsNameDecrypt implements NameDecrypt {
  decryptName(
    name: string,
    folderId: string,
    encryptVersion: string
  ): string | null {
    return crypto.decryptName(name, folderId, encryptVersion);
  }
}
