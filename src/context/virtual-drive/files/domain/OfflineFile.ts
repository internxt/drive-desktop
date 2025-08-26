import { RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

export type OfflineFileAttributes = {
  contentsId: string;
  path: RelativePath;
  size: number;
  folderUuid: string;
};

export class OfflineFile {
  private constructor(
    private _contentsId: string,
    private _folderUuid: string,
    private _path: string,
    private readonly _size: number,
  ) {}

  public get contentsId() {
    return this._contentsId;
  }

  public get folderUuid() {
    return this._folderUuid;
  }

  public get path(): string {
    return this._path;
  }

  public get size(): number {
    return this._size;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(attributes.contentsId, attributes.folderUuid, attributes.path, attributes.size);
  }
}
