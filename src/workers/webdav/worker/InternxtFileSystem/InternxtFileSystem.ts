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
import { InternxtFileSystemDependencyContainer } from './dependencyInjection/InxtFileSystemDependencyContainer';

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

  constructor(
    private readonly dependencyContainer: InternxtFileSystemDependencyContainer
  ) {
    super(new DebugPhysicalSerializer(dependencyContainer));

    this.resources = {
      '/': new PhysicalFileSystemResource(),
    };
    Logger.debug('CREATED');
  }

  _copy(
    pathFrom: Path,
    pathTo: Path,
    ctx: CopyInfo,
    callback: ReturnCallback<boolean>
  ) {
    Logger.debug('COPY ', pathFrom.toString(false), pathTo.toString(false));

    const sourceItem = this.dependencyContainer.itemSearcher.run(
      pathFrom.toString(false)
    );

    if (!sourceItem) {
      return callback(Errors.ResourceNotFound);
    }

    if (sourceItem.isFile()) {
      this.dependencyContainer.fileClonner
        .run(pathFrom.toString(false), pathTo.toString(false), ctx.overwrite)
        .then((haveBeenOverwritten: boolean) => {
          callback(undefined, haveBeenOverwritten);
        })
        .catch((err: unknown) => {
          Logger.error('[FS] Error coping file ', err);
          callback(Errors.IllegalArguments);
        });

      return;
    }
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback): void {
    if (ctx.type.isDirectory) {
      this.dependencyContainer.folderCreator
        .run(path.toString(false))
        .then(() => {
          this.resources[path.toString(false)] =
            new PhysicalFileSystemResource();
          callback();
        })
        .catch((err: unknown) => {
          Logger.error('ERROR CREATING FOLDER', err);
          callback(Errors.InvalidOperation);
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
    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      return callback(Errors.ResourceNotFound);
    }

    if (item.isFile()) {
      Logger.debug('[Deleting File]: ' + item.name + item.type);
      ipcRenderer.send('SYNC_INFO_UPDATE', {
        action: 'DELETE',
        kind: 'LOCAL',
        progress: 0,
        name: path.fileName(),
      });
      this.dependencyContainer.fileDeleter
        .run(item)
        .then(() => {
          delete this.resources[item.path.value];
          ipcRenderer.send('SYNC_INFO_UPDATE', {
            action: 'DELETED',
            kind: 'LOCAL',
            name: path.fileName(),
          });
          callback(undefined);
        })
        .catch((err: unknown) => {
          ipcRenderer.send('SYNC_INFO_UPDATE', {
            action: 'DELETE_ERROR',
            kind: 'LOCAL',
            name: path.fileName(),
            errorName: 'Deletion Error',
            errorDetails: err,
            process: 'SYNC',
          });
          callback(Errors.InvalidOperation)
        });
      return;
    }

    if (item.isFolder()) {
      this.dependencyContainer.folderDeleter
        .run(item)
        .then(() => callback())
        .catch((err: unknown) => {
          Logger.error('[FS] Error trashing folder');
          throw err;
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

    ipcRenderer.send('SYNC_INFO_UPDATE', {
      action: 'PULL',
      kind: 'REMOTE',
      name: path.fileName(),
    });

    this.dependencyContainer.fileCreator
      .run(path.toString(false), ctx.estimatedSize)
      .then((writable: Writable) => {
        callback(undefined, writable);
        ipcRenderer.send('SYNC_INFO_UPDATE', {
          action: 'PULLED',
          kind: 'REMOTE',
          name: path.fileName(),
        });
      })
      .catch((err: unknown) => {
        Logger.error('[FS] Error on open write steam ', err);
        ipcRenderer.send('SYNC_INFO_UPDATE', {
          action: 'PULL_ERROR',
          kind: 'REMOTE',
          name: path.fileName(),
          errorName: 'Push Error',
          errorDetails: err,
          process: 'SYNC',
        });
        throw err;
      });
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    Logger.debug('[OPEN READ STREAM]');

    this.dependencyContainer.fileDonwloader
      .run(path.toString(false))
      .then((readable: Readable) => {
        callback(undefined, readable);
      })
      .catch((err: unknown) => {
        Logger.error('[FS] Error downloading a file ', err);
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
    Logger.debug('[FS] MOVE');

    const originalItem = this.dependencyContainer.itemSearcher.run(
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
      this.dependencyContainer.fileMover
        .run(originalItem, pathTo.toString(false), ctx.overwrite)
        .then((hasBeenOverriden: boolean) => {
          changeResourceIndex();
          callback(undefined, hasBeenOverriden);
        })
        .catch((err: unknown) => {
          Logger.error(err);
          callback(Errors.InvalidOperation);
        });

      return;
    }

    if (originalItem.isFolder()) {
      this.dependencyContainer.folderMover
        .run(originalItem, pathTo.toString(false))
        .then(() => {
          changeResourceIndex();
          callback(undefined, false);
        })
        .catch((err: unknown) => {
          Logger.error(err);
          callback(Errors.InvalidOperation);
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
    Logger.debug('LOCK MANAGER ON :', path.toString());
    this.getPropertyFromResource(path, ctx, 'locks', callback);
  }

  _propertyManager(
    path: Path,
    ctx: PropertyManagerInfo,
    callback: ReturnCallback<IPropertyManager>
  ): void {
    Logger.debug('PROPERTY MANAGER ON :', path.toString());
    this.getPropertyFromResource(path, ctx, 'props', callback);
  }

  _readDir(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<string[] | Path[]>
  ): void {
    Logger.debug('READ');
    try {
      const names = this.dependencyContainer.allItemsLister.run(
        path.toString(false)
      );
      callback(undefined, names);
    } catch (err: unknown) {
      Logger.error('[FS] Error reading directory: ', err);
      callback(Errors.Forbidden);
    }
  }

  _displayName(
    path: Path,
    _ctx: DisplayNameInfo,
    callback: ReturnCallback<string>
  ) {
    const data = this.dependencyContainer.itemMetadataDealer.run(
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
    const data = this.dependencyContainer.itemMetadataDealer.run(
      path.toString(false),
      'createdAt'
    );

    if (!data) {
      return callback(Errors.ResourceNotFound);
    }

    return callback(undefined, data);
  }

  _mimeType(path: Path, ctx: MimeTypeInfo, callback: ReturnCallback<string>) {
    const mimeType = this.dependencyContainer.fileMimeTypeResolver.run(
      path.toString()
    );

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
    const data = this.dependencyContainer.itemMetadataDealer.run(
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
    const data = this.dependencyContainer.itemMetadataDealer.run(
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
    const data = this.dependencyContainer.itemMetadataDealer.run(
      path.toString(false),
      'size'
    );

    if (data === undefined) {
      return callback(Errors.ResourceNotFound);
    }

    return callback(undefined, data);
  }
}
