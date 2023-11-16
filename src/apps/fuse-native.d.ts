declare module 'fuse-native' {
  export interface FuseStat {
    mtime: Date;
    atime: Date;
    ctime: Date;
    size: number;
    mode: number;
    uid: number;
    gid: number;
  }

  export interface FuseHandlers {
    readdir(
      readPath: string,
      cb: (status: number, entries: string[]) => void
    ): void;
    getattr(
      readPath: string,
      cb: (status: number, stat?: FuseStat) => void
    ): void;
    open(
      readPath: string,
      flags: number,
      cb: (status: number, fd: number) => void
    ): void;
    release(readPath: string, fd: number, cb: (status: number) => void): void;
    read(
      readPath: string,
      fd: number,
      buf: Buffer,
      len: number,
      pos: number,
      cb: (bytesRead: number) => void
    ): void;
  }

  interface FuseOptions {
    displayFolder?: string;
    debug?: boolean;
  }

  class Fuse {
    // static isConfigured(): boolean
    mnt: string;

    constructor(mnt: string, handlers: FuseHandlers, opts?: FuseOptions);
    mount(cb: (error: Error | null) => void): void;
    unmount(cb: (error: Error | null) => void): void;
  }

  export default Fuse;
}
