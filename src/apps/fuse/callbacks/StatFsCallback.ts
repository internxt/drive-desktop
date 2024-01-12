import { UserDependencyContainer } from '../dependency-injection/user/UserDependencyContainer';
import { FuseCallback } from './FuseCallback';
import Logger from 'electron-log';

type StatFsCallbackData = {
  bsize: number; // fundamental file system block size in bytes
  frsize: number; // fundamental file system fragment size. It might be (or has to be?) the same as bsize
  blocks: number; // the total number of blocks on the filesystem in frsize units
  bfree: number; // the total number of free blocks
  bavail: number; // the number of free blocks available to non-superusers
  files: number; // total number of file nodes
  ffree: number; // total number of free file nodes
  favail: number; // number of free file nodes available to non-superusers
  fsid: number; // id of the file system
  flag: number; // flags about the fs
  namemax: number; // maximum length of a file name on the file system
};

export class StatFsCallback extends FuseCallback<Partial<StatFsCallbackData>> {
  constructor(
    private readonly _userContainer: UserDependencyContainer,
    private readonly localStats: Partial<StatFsCallbackData>,
    private readonly sid: number
  ) {
    super('Stat FS', true);
  }

  async execute(path: string) {
    Logger.debug('Stats FS', path);

    return this.right({
      ...this.localStats,
    });
  }
}
