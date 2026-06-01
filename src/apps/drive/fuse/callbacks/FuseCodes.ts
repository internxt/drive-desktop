export const FuseCodes = {
  // Operation not supported (Functionality not implemented)
  ENOSYS: 38,

  // No such file or directory
  ENOENT: 2,

  // File or directory already exists
  EEXIST: 17,

  // Input/output error
  EIO: 5,

  // Invalid argument
  EINVAL: 22,

  // Permission denied
  EACCES: 13,

  // Network is down
  ENETDOWN: 100,
} as const;

export type FuseCode = (typeof FuseCodes)[keyof typeof FuseCodes];
