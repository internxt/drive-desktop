export type FolderPlaceholderId = `FOLDER:${string}`;

export function isFolderPlaceholderId(input: string): input is FolderPlaceholderId {
  return input.startsWith('FOLDER:');
}
