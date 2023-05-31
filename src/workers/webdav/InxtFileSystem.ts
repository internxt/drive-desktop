/* eslint-disable no-underscore-dangle */
import {
  LocalPropertyManager,
  LastModifiedDateInfo,
  FileSystemSerializer,
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
  PhysicalSerializer,
  DisplayNameInfo,
  MoveInfo,
  CopyInfo,
  MimeTypeInfo,
} from 'webdav-server/lib/index.v2';
import { Readable, Writable } from 'stream';
import Logger from 'electron-log';
import { TreeRepository } from './TreeRepository';
import { DebugPhysicalSerializer } from './Serializer';

import mimetypes from './domain/MimeTypesMap.json';
import { FilePath } from './files/domain/FilePath';
import { InxtFileSystemDependencyContainer } from './InxtFileSystemDependencyContainer';

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

export const PhysicalSerializerVersions = {
  versions: {
    '1.0.0': PhysicalSerializer,
  },
  instances: [new PhysicalSerializer()] as FileSystemSerializer[],
};

type Metadata = {
  createdAt: number;
  updatedAt: number;
  type: ResourceType;
  name: string;
  size: number;
  extension: string;
  override: boolean;
};

export class InxtFileSystem extends FileSystem {
  static DefaultMimeType = 'application/octet-stream';

  resources: {
    [path: string]: PhysicalFileSystemResource;
  };

  constructor(
    private readonly repository: TreeRepository,
    private readonly dependencyContainer: InxtFileSystemDependencyContainer
  ) {
    super(new DebugPhysicalSerializer(repository, dependencyContainer));

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
    Logger.debug('COPY ', pathFrom.toString(false), pathTo.toString(false));

    const sourceItem = this.dependencyContainer.itemSearcher.run(
      pathFrom.toString(false)
    );

    if (!sourceItem) {
      return callback(Errors.ResourceNotFound);
    }

    if (sourceItem.isFile()) {
      const from = new FilePath(pathFrom.toString(false));
      const to = new FilePath(pathTo.toString(false));

      this.dependencyContainer.fileClonner
        .run(from, to, ctx.overwrite)
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
        .catch((err) => {
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
    const pathLike = path.toString(false);
    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      return callback(Errors.ResourceNotFound);
    }

    if (item.isFile()) {
      const filePath = new FilePath(pathLike);
      this.dependencyContainer.fileDeleter
        .run(filePath)
        .then(() => {
          delete this.resources[item.path.value];
          callback(undefined);
        })
        .catch(() => callback(Errors.InvalidOperation));
      return;
    }

    if (item.isFolder()) {
      this.repository
        .deleteFolder(item)
        .then(() => callback())
        .catch((err) => {
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

    this.dependencyContainer.fileCreator
      .run(path.toString(false), ctx.estimatedSize)
      .then((writable) => {
        callback(undefined, writable);
      })
      .catch((err) => {
        Logger.error('[FS] Error on open write steam ', err);
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
      .catch((err) => {
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
        .then((hasBeenOverriden) => {
          changeResourceIndex();
          callback(undefined, hasBeenOverriden);
        })
        .catch((err) => {
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
        .catch((err) => {
          Logger.error(err);
          callback(Errors.InvalidOperation);
        });
      return;
    }

    callback(Errors.UnrecognizedResource);
  }

  getPropertyFromResource(
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
    try {
      const names = this.dependencyContainer.allItemsLister.run(
        path.toString(false)
      );
      callback(undefined, names);
    } catch (err) {
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
    const filePath = new FilePath(path.toString(false));

    if (!filePath.hasExtension()) {
      return callback(undefined, InxtFileSystem.DefaultMimeType);
    }

    const mimeType = (mimetypes as Record<string, string>)[
      `.${filePath.extension()}`
    ];

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