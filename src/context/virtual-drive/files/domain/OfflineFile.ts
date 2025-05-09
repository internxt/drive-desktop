import { ContentsId } from '../../contents/domain/ContentsId';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';

export type OfflineFileAttributes = {
  contentsId: string;
  folderId: number;
  path: string;
  size: number;
  folderUuid: string;
};

export class OfflineFile {
  private constructor(
    private _contentsId: ContentsId,
    private _folderId: number,
    private _folderUuid: string,
    private _path: FilePath,
    private readonly _size: FileSize,
  ) {}

  public get contentsId() {
    return this._contentsId.value;
  }

  public get folderId() {
    return this._folderId;
  }

  public get folderUuid() {
    return this._folderUuid;
  }

  public get path(): string {
    return this._path.value;
  }

  public get type() {
    return this._path.extension();
  }

  public get name() {
    return this._path.name();
  }

  public get size(): number {
    return this._size.value;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(
      new ContentsId(attributes.contentsId),
      attributes.folderId,
      attributes.folderUuid,
      new FilePath(attributes.path),
      new FileSize(attributes.size),
    );
  }
}
