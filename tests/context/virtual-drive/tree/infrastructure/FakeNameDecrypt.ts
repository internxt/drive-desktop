import { NameDecrypt } from '../../../../../src/context/virtual-drive/tree/domain/NameDecrypt';

export class FakeNameDecrypt implements NameDecrypt {
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
