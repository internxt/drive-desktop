export interface Crypt {
  decryptName: (
    cipherText: string,
    salt: string,
    encryptVersion: string
  ) => string | null;

  encryptName: (name: string, salt: string) => string | null;
}
