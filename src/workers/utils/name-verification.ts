const isWindowsRootDirectory = /[a-zA-Z]:[\\/]/;
const isWindowsRootDirectoryWithoutSlash = /[a-zA-Z]:/;
const containsNullCharacter = /\0/g;

const validations = [
  (name: string) => name.includes('../'),
  (name: string) => name.startsWith('/'),
  (name: string) => isWindowsRootDirectory.test(name),
  (name: string) => isWindowsRootDirectoryWithoutSlash.test(name),
  (name: string) => name.includes('\\'),
  (name: string) => containsNullCharacter.test(name),
];

export const fileNameIsValid = (fileName: string): boolean =>
  validations.every((validation) => !validation(fileName));
