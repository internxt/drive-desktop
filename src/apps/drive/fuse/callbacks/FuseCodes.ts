// eslint-disable-next-line @typescript-eslint/no-var-requires
import Fuse from '@gcas/fuse';

export enum FuseCodes {
  // Operation not supported (Functionality not implemented)
  ENOSYS = Fuse.ENOSYS,

  // No such file or directory
  ENOENT = Fuse.ENOENT,

  // File or directory already exists
  EEXIST = Fuse.EEXIST,

  // Input/output error
  EIO = Fuse.EIO,

  // Invalid argument
  EINVAL = Fuse.EINVAL,

  // Permission denied
  EACCES = Fuse.EACCES,

  // Network is down
  ENETDOWN = Fuse.ENETDOWN,
}
