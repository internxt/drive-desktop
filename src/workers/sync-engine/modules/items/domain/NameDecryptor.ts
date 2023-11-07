export interface NameDecryptor {
  decryptName: (
    name: string,
    folderId: string,
    encryptVersion: string
  ) => string | null;
}
