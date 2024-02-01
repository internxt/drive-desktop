export interface NameDecrypt {
  decryptName: (
    name: string,
    folderId: string,
    encryptVersion: string
  ) => string | null;
}
