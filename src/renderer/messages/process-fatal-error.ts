import { ProcessFatalErrorName } from '../../workers/types';

const messages: Record<ProcessFatalErrorName, string> = {
  NO_INTERNET: "issues.process-fatal-errors.no-internet",
  NO_REMOTE_CONNECTION: "issues.process-fatal-errors.no-remote-connection",
  CANNOT_GET_CURRENT_LISTINGS: "issues.process-fatal-errors.cannot-get-current-listings",
  BASE_DIRECTORY_DOES_NOT_EXIST: "issues.process-fatal-errors.base-directory-does-not-exist",
  INSUFICIENT_PERMISION_ACCESSING_BASE_DIRECTORY: "issues.process-fatal-errors.insuficient-permision-accessing-base-directory",
  CANNOT_ACCESS_BASE_DIRECTORY: "issues.process-fatal-errors.cannot-access-base-directory",
  CANNOT_ACCESS_TMP_DIRECTORY: "issues.process-fatal-errors.cannot-access-tmp-directory",
  UNKNOWN: "issues.process-fatal-errors.unknown",
};

export default messages;
