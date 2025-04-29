import { ProcessErrorName } from '../../shared/types';

type ProcessErrorMessages = Record<ProcessErrorName, string>;

export const shortMessages: ProcessErrorMessages = {
  NOT_EXISTS: 'issues.short-error-messages.file-does-not-exist',
  NO_PERMISSION: 'issues.short-error-messages.no-permission',
  NO_INTERNET: 'issues.short-error-messages.no-internet-connection',
  NO_REMOTE_CONNECTION: 'issues.short-error-messages.no-remote-connection',
  BAD_RESPONSE: 'issues.short-error-messages.bad-response',
  EMPTY_FILE: 'issues.short-error-messages.empty-file',
  UNKNOWN: 'issues.short-error-messages.unknown',
  FILE_TOO_BIG: 'issues.short-error-messages.file-too-big',
  FILE_NON_EXTENSION: 'issues.short-error-messages.file-non-extension',
  DUPLICATED_NODE: 'issues.short-error-messages.duplicated-node',
  FILE_ALREADY_EXISTS: 'issues.short-error-messages.file-already-exists',
  COULD_NOT_ENCRYPT_NAME: '',
  BAD_REQUEST: 'issues.short-error-messages.no-remote-connection',
  BASE_DIRECTORY_DOES_NOT_EXIST: 'issues.short-error-messages.folder-does-not-exist',
  INSUFFICIENT_PERMISSION: 'issues.short-error-messages.no-permission',
  NOT_ENOUGH_SPACE: 'issues.short-error-messages.not-enough-space',
  ACTION_NOT_PERMITTED: '',
};
