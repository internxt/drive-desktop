/** TODO: DELETE DEAD CODE*/
import path from 'path';

const isWindowsRootDirectory = /[a-zA-Z]:[\\/]/;
const containsNullCharacter = /\0/g;

const validations = [
  (name: string) => name.includes('../'),
  (name: string) => name.includes('..'),
  // TODO: when adding a physical fs this needs to be added to it
  // (name: string) => name.startsWith('/'),
  (name: string) => isWindowsRootDirectory.test(name),
  (name: string) => containsNullCharacter.test(name),
];

const sanitizeRelativePath = (relativePath: string) =>
  relativePath.replaceAll(path.sep, '/');

export const fileNameIsValid = (fileName: string): boolean => {
  const sanitatedPath = sanitizeRelativePath(fileName);

  return validations.every((validation) => !validation(sanitatedPath));
};
