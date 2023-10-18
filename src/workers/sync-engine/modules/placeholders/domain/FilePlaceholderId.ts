export type FilePlaceholderIdPrefixType = 'FILE:';
export const FilePlaceholderIdPrefix = 'FILE:';

export type FilePlaceholderId = `${FilePlaceholderIdPrefixType}${string}`;

function typedCheck(
  input: string,
  prefix: FilePlaceholderIdPrefixType = 'FILE:'
): input is FilePlaceholderId {
  return input.startsWith(prefix);
}
export function isFilePlaceholderId(input: string): input is FilePlaceholderId {
  return typedCheck(input);
}

function typedCreate(
  id: string,
  prefix: FilePlaceholderIdPrefixType = 'FILE:'
): FilePlaceholderId {
  return (prefix + id) as FilePlaceholderId;
}

export function createFilePlaceholderId(id: string): FilePlaceholderId {
  return typedCreate(id);
}
