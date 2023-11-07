import { NameDecryptor } from '../../domain/NameDecryptor';

export class FakeNameDecryptor implements NameDecryptor {
  decryptName(
    name: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _folderId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _encryptVersion: string
  ): string | null {
    return name;
  }
}
