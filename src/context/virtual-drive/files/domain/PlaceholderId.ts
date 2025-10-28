export type FilePlaceholderId = `FILE:${string}`;

export function isFilePlaceholderId(input: string): input is FilePlaceholderId {
  return input.startsWith('FILE:');
}
