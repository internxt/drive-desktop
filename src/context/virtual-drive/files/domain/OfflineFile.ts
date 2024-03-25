import { ContentsId } from '../../contents/domain/ContentsId';
import { Folder } from '../../folders/domain/Folder';
import { AggregateRoot } from '../../../shared/domain/AggregateRoot';
import { FilePath } from './FilePath';
import { FileSize } from './FileSize';
import { FileCreatedDomainEvent } from './events/FileCreatedDomainEvent';

export type OfflineFileAttributes = {
  contentsId: string;
  folderId: number;
  path: string;
  size: number;
};

export class OfflineFile extends AggregateRoot {
  private constructor(
    private _contentsId: ContentsId,
    private _folderId: number,
    private _path: FilePath,
    private readonly _size: FileSize
  ) {
    super();
  }

  public get contentsId() {
    return this._contentsId.value;
  }

  public get folderId() {
    return this._folderId;
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

  public get nameWithExtension() {
    return this._path.nameWithExtension();
  }

  public get dirname() {
    return this._path.dirname();
  }

  public get size(): number {
    return this._size.value;
  }

  static from(attributes: OfflineFileAttributes): OfflineFile {
    return new OfflineFile(
      new ContentsId(attributes.contentsId),
      attributes.folderId,
      new FilePath(attributes.path),
      new FileSize(attributes.size)
    );
  }

  static create(
    contentsId: ContentsId,
    folder: Folder,
    size: FileSize,
    path: FilePath
  ): OfflineFile {
    const file = new OfflineFile(contentsId, folder.id, path, size);

    file.record(
      new FileCreatedDomainEvent({
        aggregateId: contentsId.value,
        size: file.size,
        type: path.extension(),
        path: file.path,
      })
    );

    return file;
  }

  hasParent(id: number): boolean {
    return this.folderId === id;
  }

  isFolder(): this is Folder {
    return false;
  }

  isFile(): this is File {
    return true;
  }

  attributes(): OfflineFileAttributes {
    return {
      contentsId: this.contentsId,
      folderId: this.folderId,
      path: this._path.value,
      size: this._size.value,
    };
  }
}
