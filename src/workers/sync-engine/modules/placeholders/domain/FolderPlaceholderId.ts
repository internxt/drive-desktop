export type FolderPlaceholderIdPrefix = 'FOLDER:';

export type FolderPlaceholderId = `${FolderPlaceholderIdPrefix}${string}`;

function typedCheck(
  input: string,
  prefix: FolderPlaceholderIdPrefix = 'FOLDER:'
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
  prefix: FolderPlaceholderIdPrefix = 'FOLDER:'
): FolderPlaceholderId {
  return (prefix + id) as FolderPlaceholderId;
}

export function createFolderPlaceholderId(id: string): FolderPlaceholderId {
  return typedCreate(id);
}
