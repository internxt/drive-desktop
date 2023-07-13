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
  RenameInfo,
} from '@internxt/webdav-server';
import { Readable, Writable } from 'stream';
import Logger from 'electron-log';
import { DebugPhysicalSerializer } from './Serializer';
import { handleFileSystemError } from '../error-handling';
import { DependencyContainer } from '../../dependencyInjection/DependencyContainer';
import { FileActionCannotModifyExtension } from '../../modules/files/domain/errors/FileActionCannotModifyExtension';
import { FileActionOnlyCanAffectOneLevelError } from '../../modules/files/domain/errors/FileActionOnlyCanAffectOneLevelError';
import { FileNameShouldDifferFromOriginalError } from '../../modules/files/domain/errors/FileNameShouldDifferFromOriginalError';
import { FileCannotBeMovedToTheOriginalFolderError } from '../../modules/files/domain/errors/FileCannotBeMovedToTheOriginalFolderError';
import { RemoteFileContents } from '../../modules/files/domain/RemoteFileContent';
import { WebdavFileValidator } from 'workers/webdav/modules/files/application/WebdavFileValidator';

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

  private fileValidator = new WebdavFileValidator();
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
        .run(sourceItem, pathTo.toString(false), ctx.overwrite)
        .then((haveBeenOverwritten: boolean) => {
          callback(undefined, haveBeenOverwritten);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'Upload', 'File', ctx);
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
          handleFileSystemError(error, 'Upload', 'Folder', ctx);
          callback(error);
        });
      return;
    }

    if (ctx.type.isFile) {
      const isValidName = this.fileValidator.validatePath(path);
      if (!isValidName) return callback(Errors.UnrecognizedResource);

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
      const isValidName = this.fileValidator.validatePath(path);
      if (!isValidName) return callback(Errors.UnrecognizedResource);

      Logger.debug('[Deleting File]: ' + item.name + item.type);
      this.container.fileDeleter
        .run(item)
        .then(() => {
          delete this.resources[item.path];
          callback(undefined);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'Delete', 'File', ctx);
          callback(error);
        });
      return;
    }

    if (item.isFolder()) {
      this.container.folderDeleter
        .run(item)
        .then(() => callback())
        .catch((error: Error) => {
          handleFileSystemError(error, 'Delete', 'Folder', ctx);
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

    this.container.fileCreator
      .run(path.toString(false), ctx.estimatedSize)
      .then(({ stream }: { stream: Writable; upload: Promise<string> }) => {
        callback(undefined, stream);
      })
      .catch((error: Error) => {
        handleFileSystemError(error, 'Upload', 'File', ctx);
        callback(error);
      });
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    this.container.fileDownloader
      .run(path.toString(false))
      .then((remoteFileContents: RemoteFileContents) => {
        callback(undefined, remoteFileContents.stream);
      })
      .catch((error: Error) => {
        handleFileSystemError(error, 'Download', 'File', ctx);
      });
  }

  _rename(
    pathFrom: Path,
    _newName: string,
    ctx: RenameInfo,
    callback: ReturnCallback<boolean>
  ) {
    Logger.debug('RENAME');
    const originalItem = this.container.itemSearcher.run(
      pathFrom.toString(false)
    );

    if (!originalItem) {
      return callback(Errors.ResourceNotFound);
    }

    if (originalItem.isFile()) {
      const isValidName = this.fileValidator.validatePath(pathFrom);
      if (!isValidName) return callback(Errors.UnrecognizedResource);
      this.container.fileRenamer.run(
        originalItem,
        ctx.destinationPath.toString(false)
      );
    }

    if (originalItem.isFolder()) {
      this.container.folderRenamer.run(
        originalItem,
        ctx.destinationPath.toString(false)
      );
    }
  }

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
        this.resources[originalItem.path];

      delete this.resources[originalItem.path];
    };

    if (originalItem.isFile()) {
      const isValidName = this.fileValidator.validatePath(pathFrom);
      if (!isValidName) return callback(Errors.UnrecognizedResource);
      this.container.fileMover
        .run(originalItem, pathTo.toString(false), ctx.overwrite)
        .then((hasBeenOverriden: boolean) => {
          changeResourceIndex();
          callback(undefined, hasBeenOverriden);
        })
        .catch((error: Error) => {
          handleFileSystemError(error, 'Move', 'File', ctx);

          if (error instanceof FileCannotBeMovedToTheOriginalFolderError) {
            return callback(Errors.IllegalArguments);
          }

          if (error instanceof FileActionCannotModifyExtension) {
            return callback(Errors.InvalidOperation);
          }

          if (error instanceof FileActionOnlyCanAffectOneLevelError) {
            return callback(Errors.InvalidOperation);
          }

          if (error instanceof FileNameShouldDifferFromOriginalError) {
            return callback(Errors.IllegalArguments);
          }

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
          handleFileSystemError(error, 'Move', 'Folder', ctx);
          callback(error);
        });
      return;
    }

    callback(Errors.UnrecognizedResource);
  }

  private getPropertyFromResource(
    path: Path,
    _ctx: any,
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
    this.container.allItemsLister
      .run(path.toString(false))
      .then((names) => callback(undefined, names))
      .catch((error: Error) => {
        handleFileSystemError(error, 'Download', 'Folder', ctx);
        callback(error);
      });
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
    _ctx: CreationDateInfo,
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

  _mimeType(path: Path, _ctx: MimeTypeInfo, callback: ReturnCallback<string>) {
    const mimeType = this.container.fileMimeTypeResolver.run(path.toString());

    if (!mimeType) {
      Logger.debug('NO MIME TYPE');
      return callback(Errors.UnrecognizedResource);
    }

    callback(undefined, mimeType);
  }

  _lastModifiedDate(
    path: Path,
    _ctx: LastModifiedDateInfo,
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
    _ctx: TypeInfo,
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

  _size(path: Path, _ctx: SizeInfo, callback: ReturnCallback<number>): void {
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
