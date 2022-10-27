type FileNameTestResult = {
  fails: boolean;
  reason: string;
};
type FileNameTest = (name: string) => FileNameTestResult;

const isWindowsRootDirectory = /[a-zA-Z]:[\\/]/;
const containsNullCharacter = /\0/g;

const validations: Array<FileNameTest> = [
  (name: string) => ({
    fails: name.includes('/'),
    reason: 'File name contains a directory separator',
  }),
  (name: string) => ({
    fails: isWindowsRootDirectory.test(name),
    reason: 'File name contains the root directory of windows',
  }),
  (name: string) => ({
    fails: name.includes('\\'),
    reason: 'File name contains a directory separator',
  }),
  (name: string) => ({
    fails: containsNullCharacter.test(name),
    reason: 'File name contains null bytes (%00)',
  }),
];

export const fileNameIsValid = (fileName: string): boolean =>
  validations.every((validation) => validation(fileName).fails);
