import { FuseCallback } from './FuseCallback';

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
  constructor() {
    super('Stat FS');
  }

  async execute(path: string) {
    return this.right({
      bsize: 1000000,
      frsize: 1000000,
      blocks: 1000000,
      bfree: 1000000,
      bavail: 1000000,
      files: 1000000,
      ffree: 1000000,
      favail: 1000000,
      fsid: 1000000,
      flag: 1000000,
      namemax: 1000000,
    });
  }
}
