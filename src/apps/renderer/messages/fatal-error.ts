import { FatalError } from '../../../shared/issues/FatalError';

const messages: Record<FatalError, string> = {
  NO_INTERNET: 'issues.error-messages.no-internet',
  NO_REMOTE_CONNECTION: 'issues.error-messages.no-remote-connection',
  CANNOT_GET_CURRENT_LISTINGS:
    'issues.error-messages.cannot-get-current-listings',
  BASE_DIRECTORY_DOES_NOT_EXIST:
    'issues.error-messages.base-directory-does-not-exist',
  INSUFFICIENT_PERMISSION_ACCESSING_BASE_DIRECTORY:
    'issues.error-messages.insufficient-permission-accessing-base-directory',
  CANNOT_ACCESS_BASE_DIRECTORY:
    'issues.error-messages.cannot-access-base-directory',
  CANNOT_ACCESS_TMP_DIRECTORY:
    'issues.error-messages.cannot-access-tmp-directory',
  UNKNOWN: 'issues.error-messages.unknown',
};

export default messages;
