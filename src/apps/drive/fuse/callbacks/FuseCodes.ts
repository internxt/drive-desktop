// eslint-disable-next-line @typescript-eslint/no-var-requires
const fuse = require('@gcas/fuse');

export enum FuseCodes {
  // Operation not supported (Functionality not implemented)
  ENOSYS = fuse.ENOSYS,

  // No such file or directory
  ENOENT = fuse.ENOENT,

  // File or directory already exists
  EEXIST = fuse.EEXIST,

  // Input/output error
  EIO = fuse.EIO,

  // Invalid argument
  EINVAL = fuse.EINVAL,

  // Permission denied
  EACCES = fuse.EACCES,
}
