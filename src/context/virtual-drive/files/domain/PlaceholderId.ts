type FilePlaceholderIdPrefixType = 'FILE:';

export type FilePlaceholderId = `${FilePlaceholderIdPrefixType}${string}`;

function typedCheck(input: string, prefix: FilePlaceholderIdPrefixType = 'FILE:'): input is FilePlaceholderId {
  return input.startsWith(prefix);
}
export function isFilePlaceholderId(input: string): input is FilePlaceholderId {
  return typedCheck(input);
}
