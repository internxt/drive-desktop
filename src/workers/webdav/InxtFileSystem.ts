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
import { PassThrough, Readable, Writable } from 'stream';
import Logger from 'electron-log';
import { TreeRepository } from './TreeRepository';
import { WebdavFile } from './files/domain/WebdavFile';
import { DebugPhysicalSerializer } from './Serializer';
import { FileUploader } from './files/infrastructure/FileUploader';
import { FileDownloader } from './files/infrastructure/FileDownloader';

import mimetypes from './domain/MimeTypesMap.json';
import { FilePath } from './files/domain/FilePath';
import { FolderPath } from './folders/domain/FolderPath';
import { WebdavFileMover } from './files/application/WebdavFileMover';
import { WebdavFolderFinder } from './folders/application/WebdavFolderFinder';
import { WebdavFileRepository } from './files/domain/WebdavFileRepository';
import { WebdavFolderRepository } from './folders/domain/WebdavFolderRepository';
import { WebdavFolderMover } from './folders/application/WebdavFolderMover';
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

  filesToUpload: Record<string, Metadata> = {};

  filesToOverride: Array<string> = [];

  fileRepository: WebdavFileRepository;

  folderRepository: WebdavFolderRepository;

  folderFinder: WebdavFolderFinder;

  constructor(
    private readonly fileUploader: FileUploader,
    private readonly fileDownloader: FileDownloader,
    private readonly repository: TreeRepository,
    private readonly dependencyContainer: InxtFileSystemDependencyContainer
  ) {
    super(new DebugPhysicalSerializer(fileUploader, repository));

    this.fileRepository = {
      search: this.repository.searchItem.bind(this.repository),
      delete: this.repository.deleteFile.bind(this.repository),
      add: this.repository.addFile.bind(this.repository),
      updateName: this.repository.updateName.bind(this.repository),
      updateParentDir: this.repository.updateParentDir.bind(this.repository),
    } as unknown as WebdavFileRepository;

    this.folderRepository = {
      search: this.repository.searchItem.bind(this.repository),
      delete: this.repository.deleteFile.bind(this.repository),
      updateName: this.repository.updateName.bind(this.repository),
      updateParentDir: this.repository.updateParentDir.bind(this.repository),
    } as unknown as WebdavFolderRepository;

    this.folderFinder = new WebdavFolderFinder(this.folderRepository);

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

    const sourceItem = this.repository.searchItem(pathFrom.toString(false));

    if (!sourceItem) {
      return callback(Errors.ResourceNotFound);
    }

    if (sourceItem.isFile()) {
      const filePath = new FilePath(pathTo.toString(false));

      this.dependencyContainer.fileClonner
        .run(filePath, filePath, ctx.overwrite)
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
      this.repository.deleteFolder(item).then(() => callback());
    }
  }

  _openWriteStream(
    path: Path,
    ctx: OpenWriteStreamInfo,
    callback: ReturnCallback<Writable>
  ): void {
    const resource = this.resources[path.toString(false)];

    const newFilePaht = new FilePath(path.toString(false));

    if (!this.filesToUpload[path.toString(false)]) {
      this.filesToUpload[path.toString(false)] = {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: ResourceType.File,
        name: newFilePaht.name(),
        size: ctx.estimatedSize,
        extension: newFilePaht.extension(),
        override: false,
      };
    }

    if (!resource) {
      this.resources[path.toString(false)] = new PhysicalFileSystemResource();
    }

    const stream = new PassThrough();

    Logger.debug('WRITE STEAM ON ', path.toString(false));

    this.fileUploader
      .upload({
        size: ctx.estimatedSize,
        contents: stream,
      })
      .then(async (fileId: string) => {
        const parent = this.repository.searchParentFolder(path.toString(false));

        if (!parent) {
          Logger.error('A file need a folder parent to be created');
          throw new Error('A file need a folder parent to be created');
        }

        const filePath = new FilePath(path.toString(false));

        Logger.debug('new path', filePath.value);

        const file = new WebdavFile(
          fileId,
          parent.id,
          filePath.name(),
          filePath,
          ctx.estimatedSize,
          filePath.extension(),
          new Date(),
          new Date(),
          new Date()
        );

        await this.repository.addFile(file);

        return filePath.value;
      })
      .then((fileUploaded: string) => {
        delete this.filesToUpload[fileUploaded];
      })
      .catch((err) => Logger.error(err));

    callback(undefined, stream);
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    Logger.debug('[OPEN READ STREAM]');
    const item = this.repository.searchItem(path.toString(false));

    if (!item) {
      return callback(Errors.ResourceNotFound);
    }

    if (item.isFolder()) {
      return callback(Errors.InvalidOperation);
    }

    this.fileDownloader
      .download(item.fileId)
      .then((readable) => {
        if (!readable) {
          return callback(Errors.UnrecognizedResource);
        }

        callback(undefined, readable);
      })
      .catch(() => callback(Errors.UnrecognizedResource));
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

    const originalItem = this.repository.searchItem(pathFrom.toString(false));

    if (!originalItem) {
      return callback(Errors.ResourceNotFound);
    }

    const changeResourceIndex = () => {
      this.resources[pathTo.toString(false)] =
        this.resources[originalItem.path.value];

      delete this.resources[originalItem.path.value];
      this.repository.deleteCachedItem(originalItem);
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
    let resource = this.resources[path.toString()];
    if (!resource) {
      resource = new PhysicalFileSystemResource();
      this.resources[path.toString()] = resource;
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
    Logger.debug('[FS DISPLAY NAME]', path.toString());

    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      const file = this.filesToUpload[path.toString(false)];

      if (!file) {
        return callback(Errors.ResourceNotFound);
      }

      return callback(undefined, file.name);
    }

    if (item.isFile()) {
      return callback(undefined, item.path.nameWithExtension());
    }

    if (item.isFolder()) {
      return callback(undefined, item.name);
    }

    callback(Errors.UnrecognizedResource);
  }

  _creationDate(
    path: Path,
    ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ): void {
    Logger.debug('[FS] CREATION DATE');
    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      const file = this.filesToUpload[path.toString(false)];

      if (!file) {
        return callback(Errors.ResourceNotFound);
      }

      return callback(undefined, file.createdAt);
    }

    callback(undefined, item.createdAt.getTime());
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
    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      const file = this.filesToUpload[path.toString(false)];

      if (!file) {
        return callback(Errors.ResourceNotFound);
      }

      return callback(undefined, file.updatedAt);
    }

    callback(undefined, item.updatedAt.getTime());
  }

  _type(
    path: Path,
    ctx: TypeInfo,
    callback: ReturnCallback<ResourceType>
  ): void {
    Logger.debug('[FS] TYPE >> ', path.toString());

    const pathLike = path.toString(false);

    if (pathLike === '/') {
      callback(undefined, ResourceType.Directory);
      return;
    }

    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      const file = this.filesToUpload[path.toString(false)];

      if (!file) {
        return callback(Errors.ResourceNotFound);
      }

      return callback(undefined, file.type);
    }

    const resource = new ResourceType(item.isFile(), item.isFolder());
    callback(undefined, resource);
  }

  _size(path: Path, ctx: SizeInfo, callback: ReturnCallback<number>): void {
    Logger.debug('[FS] SIZE', path.toString());

    const item = this.dependencyContainer.itemSearcher.run(
      path.toString(false)
    );

    if (!item) {
      const file = this.filesToUpload[path.toString(false)];

      if (!file) {
        return callback(Errors.ResourceNotFound);
      }

      return callback(undefined, file.size);
    }

    callback(undefined, item.size);
  }
}
