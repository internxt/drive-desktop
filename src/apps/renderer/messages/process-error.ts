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
  DUPLICATED_NODE: 'issues.short-error-messages.duplicated-node',
};

export const longMessages: ProcessErrorMessages = {
  NOT_EXISTS: 'issues.error-messages.file-does-not-exist',
  NO_PERMISSION:
    'issues.error-messages.insuficient-permision-accessing-base-directory',
  NO_INTERNET: 'issues.error-messages.no-internet',
  NO_REMOTE_CONNECTION: 'issues.error-messages.no-remote-connection',
  BAD_RESPONSE: 'issues.error-messages.bad-response',
  EMPTY_FILE: 'issues.error-messages.empty-file',
  UNKNOWN: 'issues.error-messages.unknown',
  FILE_TOO_BIG: 'issues.error-messages.file-too-big',
  DUPLICATED_NODE: 'issues.error-messages.duplicated-node',
};
