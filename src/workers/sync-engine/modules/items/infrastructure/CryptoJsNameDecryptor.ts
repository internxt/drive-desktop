import crypto from '../../../../utils/crypt';
import { NameDecryptor } from '../domain/NameDecryptor';

export class CryptoJsNameDecryptor implements NameDecryptor {
  decryptName(
    name: string,
    folderId: string,
    encryptVersion: string
  ): string | null {
    return crypto.decryptName(name, folderId, encryptVersion);
  }
}
