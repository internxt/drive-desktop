export type FilePlaceholderIdPrefix = 'FILE:';

export type FilePlaceholderId = `${FilePlaceholderIdPrefix}${string}`;

function typedCheck(
  input: string,
  prefix: FilePlaceholderIdPrefix = 'FILE:'
): input is FilePlaceholderId {
  return input.startsWith(prefix);
}
export function isFilePlaceholderId(input: string): input is FilePlaceholderId {
  return typedCheck(input);
}

function typedCreate(
  id: string,
  prefix: FilePlaceholderIdPrefix = 'FILE:'
): FilePlaceholderId {
  return (prefix + id) as FilePlaceholderId;
}

export function createFilePlaceholderId(id: string): FilePlaceholderId {
  return typedCreate(id);
}
