const FatalErrors = [
  'NOT_ENOUGH_SPACE',
  'NO_INTERNET',
  'NO_REMOTE_CONNECTION',
  'INSUFFICIENT_PERMISSION',
  'BASE_DIRECTORY_DOES_NOT_EXIST',
] as const;

export type FatalError = (typeof FatalErrors)[number];

const NonFatalErrors = [
  'NOT_EXISTS',
  'BAD_RESPONSE',
  'EMPTY_FILE',
  'FILE_TOO_BIG',
  'FILE_NON_EXTENSION',
  'DUPLICATED_NODE',
  'ACTION_NOT_PERMITTED',
  'FILE_ALREADY_EXISTS',
  'COULD_NOT_ENCRYPT_NAME',
  'BAD_REQUEST',
  'UNKNOWN',
] as const;

const Errors = [...FatalErrors, ...NonFatalErrors] as const;

export type SyncError = (typeof Errors)[number];

export function isSyncError(maybe: string): maybe is SyncError {
  return Errors.includes(maybe as SyncError);
}

export function isFatalError(maybe: string): maybe is FatalError {
  return FatalErrors.includes(maybe as FatalError);
}
