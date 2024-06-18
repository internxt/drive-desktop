export abstract class NameDecrypt {
  abstract decryptName: (
    name: string,
    folderId: string,
    encryptVersion: string
  ) => string | null;
}
