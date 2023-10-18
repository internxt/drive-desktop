export type FolderPlaceholderIdPrefixType = 'FOLDER:';
export const FolderPlaceholderIdPrefix = 'FOLDER:';

export type FolderPlaceholderId = `${FolderPlaceholderIdPrefixType}${string}`;

function typedCheck(
  input: string,
  prefix: FolderPlaceholderIdPrefixType = 'FOLDER:'
): input is FolderPlaceholderId {
  return input.startsWith(prefix);
}

export function isFolderPlaceholderId(
  input: string
): input is FolderPlaceholderId {
  return typedCheck(input);
}

function typedCreate(
  id: string,
  prefix: FolderPlaceholderIdPrefixType = 'FOLDER:'
): FolderPlaceholderId {
  return (prefix + id) as FolderPlaceholderId;
}

export function createFolderPlaceholderId(id: string): FolderPlaceholderId {
  return typedCreate(id);
}
