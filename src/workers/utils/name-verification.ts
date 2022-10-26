import { ReadingMetaErrorEntry } from '../types';
import { createErrorDetails } from './reporting';

type FileNameTestResult = {
  passes: boolean;
  reason: string;
};
type FileNameTest = (name: string) => FileNameTestResult;

const isWindowsRootDirectory = /[a-zA-Z]:[\\/]/;
const containsNullCharacter = /\0/g;

const validations: Array<FileNameTest> = [
  (name: string) => ({
    passes: name.includes('/'),
    reason: 'File name contains a directory separator',
  }),
  (name: string) => ({
    passes: isWindowsRootDirectory.test(name),
    reason: 'File name contains the root directory of windows',
  }),
  (name: string) => ({
    passes: name.includes('\\'),
    reason: 'File name contains a directory separator',
  }),
  (name: string) => ({
    passes: containsNullCharacter.test(name),
    reason: 'File name contains null bytes (%00)',
  }),
];

export const fileNameIsValid = (fileName: string): Array<FileNameTestResult> =>
  validations
    .map((validation) => {
      const result = validation(fileName);

      return result.passes ? result : null;
    })
    .filter((reason) => reason !== null) as Array<FileNameTestResult>;

export const fileNameNotValidError = (
  fileName: string,
  additionalInfo: string
): ReadingMetaErrorEntry => ({
  name: fileName,
  errorName: 'TRAVERSAL_PATH',
  errorDetails: createErrorDetails(
    {
      message: 'This file may be harmful',
      code: '',
      stack: '',
    },
    'Reading file name',
    additionalInfo
  ),
});
