import { Crypt } from '../../../../../src/context/virtual-drive/shared/domain/Crypt';

export const fakeDecryptor: Crypt = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decryptName: (cipherText: string, _salt: string, _encryptVersion: string) =>
    cipherText,

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  encryptName: function (name: string, _salt: string): string | null {
    return name;
  },
};
