/* eslint-disable no-underscore-dangle */
import {
  LocalPropertyManager,
  LastModifiedDateInfo,
  OpenWriteStreamInfo,
  PropertyManagerInfo,
  OpenReadStreamInfo,
  IPropertyManager,
  LocalLockManager,
  CreationDateInfo,
  LockManagerInfo,
  SimpleCallback,
  ReturnCallback,
  ResourceType,
  ILockManager,
  ReadDirInfo,
  CreateInfo,
  DeleteInfo,
  FileSystem,
  SizeInfo,
  TypeInfo,
  Path,
  Errors,
  DisplayNameInfo,
  MoveInfo,
  CopyInfo,
  MimeTypeInfo,
} from 'webdav-server/lib/index.v2';
import { Readable, Writable } from 'stream';
import Logger from 'electron-log';
import { DebugPhysicalSerializer } from './Serializer';
import { handleFileSystemError } from '../error-handling';
import { DependencyContainer } from '../../dependencyInjection/DependencyContainer';

export class PhysicalFileSystemResource {
  props: LocalPropertyManager;

  locks: LocalLockManager;

  constructor(data?: PhysicalFileSystemResource) {
    if (!data) {
      this.props = new LocalPropertyManager();
      this.locks = new LocalLockManager();
    } else {
      const rs = data as PhysicalFileSystemResource;
      this.props = new LocalPropertyManager(rs.props);
      this.locks = new LocalLockManager();
    }
  }
}

export class InternxtFileSystem extends FileSystem {
  resources: {
    [path: string]: PhysicalFileSystemResource;
  };

  constructor(private readonly container: DependencyContainer) {
    super(new DebugPhysicalSerializer(container));

    this.resources = {
      '/': new PhysicalFileSystemResource(),
    };
  }

  _copy(
    pathFrom: Path,
    pathTo: Path,
    ctx: CopyInfo,
    callback: ReturnCallback<boolean>
  ) {
    const sourceItem = this.container.itemSearcher.run(
      pathFrom.toString(false)
    );

    if (!sourceItem) {
      return callback(Errors.ResourceNotFound);
    }

    if (sourceItem.isFile()) {
      this.container.fileClonner
        .run(pathFrom.toString(false), pathTo.toString(false), ctx.overwrite)
        .then((haveBeenOverwritten: boolean) => {
          callback(undefined, haveBeenOverwritten);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'copy file', ctx);
          callback(error);
        });

      return;
    }

    return callback(Errors.InvalidOperation);
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback): void {
    if (ctx.type.isDirectory) {
      this.container.folderCreator
        .run(path.toString(false))
        .then(() => {
          this.resources[path.toString(false)] =
            new PhysicalFileSystemResource();
          callback();
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'create file', ctx);
          callback(error);
        });
      return;
    }

    if (ctx.type.isFile) {
      this.resources[path.toString(false)] = new PhysicalFileSystemResource();

      return callback();
    }

    callback(Errors.InvalidOperation);
  }

  _delete(path: Path, ctx: DeleteInfo, callback: SimpleCallback): void {
    const item = this.container.itemSearcher.run(path.toString(false));

    if (!item) {
      return callback(Errors.ResourceNotFound);
    }

    if (item.isFile()) {
      this.container.fileDeleter
        .run(item)
        .then(() => {
          delete this.resources[item.path.value];
          callback(undefined);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'create file', ctx);
          callback(error);
        });
      return;
    }

    if (item.isFolder()) {
      this.container.folderDeleter
        .run(item)
        .then(() => callback())
        .catch((error: Error) => {
          handleFileSystemError(error, 'create file', ctx);
          callback(error);
        });
    }
  }

  _openWriteStream(
    path: Path,
    ctx: OpenWriteStreamInfo,
    callback: ReturnCallback<Writable>
  ): void {
    const resource = this.resources[path.toString(false)];

    if (!resource) {
      this.resources[path.toString(false)] = new PhysicalFileSystemResource();
    }

    Logger.debug('WRITE STEAM ON ', path.toString(false));

    this.container.fileCreator
      .run(path.toString(false), ctx.estimatedSize)
      .then((writable: Writable) => {
        callback(undefined, writable);
      })
      .catch((error: Error) => {
        handleFileSystemError(error, 'create file', ctx);
        callback(error);
      });
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    this.container.fileDonwloader
      .run(path.toString(false))
      .then((readable: Readable) => {
        callback(undefined, readable);
      })
      .catch((err: unknown) => {
        throw err;
      });
  }

  // The _rename method is not being called, instead the _move method is called
  // _rename(
  //   pathFrom: Path,
  //   newName: string,
  //   ctx: RenameInfo,
  //   callback: ReturnCallback<boolean>
  // ) {}

  _move(
    pathFrom: Path,
    pathTo: Path,
    ctx: MoveInfo,
    callback: ReturnCallback<boolean>
  ): void {
    const originalItem = this.container.itemSearcher.run(
      pathFrom.toString(false)
    );

    if (!originalItem) {
      return callback(Errors.ResourceNotFound);
    }

    const changeResourceIndex = () => {
      this.resources[pathTo.toString(false)] =
        this.resources[originalItem.path.value];

      delete this.resources[originalItem.path.value];
      // this.repository.deleteCachedItem(originalItem);
    };

    if (originalItem.isFile()) {
      this.container.fileMover
        .run(originalItem, pathTo.toString(false), ctx.overwrite)
        .then((hasBeenOverriden: boolean) => {
          changeResourceIndex();
          callback(undefined, hasBeenOverriden);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'create file', ctx);
          callback(error);
        });

      return;
    }

    if (originalItem.isFolder()) {
      this.container.folderMover
        .run(originalItem, pathTo.toString(false))
        .then(() => {
          changeResourceIndex();
          callback(undefined, false);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'create file', ctx);
          callback(error);
        });
      return;
    }

    callback(Errors.UnrecognizedResource);
  }

  private getPropertyFromResource(
    path: Path,
    ctx: any,
    propertyName: string,
    callback: ReturnCallback<any>
  ): void {
    let resource = this.resources[path.toString(false)];
    if (!resource) {
      resource = new PhysicalFileSystemResource();
      this.resources[path.toString(false)] = resource;
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const property = resource[propertyName];

    callback(undefined, property);
  }

  _lockManager(
    path: Path,
    ctx: LockManagerInfo,
    callback: ReturnCallback<ILockManager>
  ): void {
    this.getPropertyFromResource(path, ctx, 'locks', callback);
  }

  _propertyManager(
    path: Path,
    ctx: PropertyManagerInfo,
    callback: ReturnCallback<IPropertyManager>
  ): void {
    this.getPropertyFromResource(path, ctx, 'props', callback);
  }

  _readDir(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<string[] | Path[]>
  ): void {
    try {
      const names = this.container.allItemsLister.run(path.toString(false));
      callback(undefined, names);
    } catch (error: unknown) {
      const e =
        error instanceof Error ? error : new Error('Error reading directory');

      handleFileSystemError(e, 'create file', ctx);
      callback(e);
    }
  }

  _displayName(
    path: Path,
    _ctx: DisplayNameInfo,
    callback: ReturnCallback<string>
  ) {
    const data = this.container.itemMetadataDealer.run(
      path.toString(false),
      'name'
    );

    if (!data) {
      return callback(Errors.ResourceNotFound);
    }
    return callback(undefined, data);
  }

  _creationDate(
    path: Path,
    ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ): void {
    const data = this.container.itemMetadataDealer.run(
      path.toString(false),
      'createdAt'
    );

    if (!data) {
      return callback(Errors.ResourceNotFound);
    }

    return callback(undefined, data);
  }

  _mimeType(path: Path, ctx: MimeTypeInfo, callback: ReturnCallback<string>) {
    const mimeType = this.container.fileMimeTypeResolver.run(path.toString());

    if (!mimeType) {
      return callback(Errors.UnrecognizedResource);
    }

    callback(undefined, mimeType);
  }

  _lastModifiedDate(
    path: Path,
    ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ): void {
    const data = this.container.itemMetadataDealer.run(
      path.toString(false),
      'updatedAt'
    );

    if (!data) {
      return callback(Errors.ResourceNotFound);
    }

    return callback(undefined, data);
  }

  _type(
    path: Path,
    ctx: TypeInfo,
    callback: ReturnCallback<ResourceType>
  ): void {
    const data = this.container.itemMetadataDealer.run(
      path.toString(false),
      'type'
    );

    if (!data) {
      return callback(Errors.ResourceNotFound);
    }

    const type = data === 'FILE' ? ResourceType.File : ResourceType.Directory;
    return callback(undefined, type);
  }

  _size(path: Path, ctx: SizeInfo, callback: ReturnCallback<number>): void {
    const data = this.container.itemMetadataDealer.run(
      path.toString(false),
      'size'
    );

    if (data === undefined) {
      return callback(Errors.ResourceNotFound);
    }

    return callback(undefined, data);
  }
}
