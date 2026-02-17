export type FolderPlaceholderIdPrefixType = 'FOLDER:';

export type FolderPlaceholderId = `${FolderPlaceholderIdPrefixType}${string}`;

function typedCreate(id: string, prefix: FolderPlaceholderIdPrefixType = 'FOLDER:'): FolderPlaceholderId {
  return (prefix + id) as FolderPlaceholderId;
}

export function createFolderPlaceholderId(id: string): FolderPlaceholderId {
  return typedCreate(id);
}
