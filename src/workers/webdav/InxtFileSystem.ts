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
import { FileUploader } from './application/FileUploader';
import { TreeRepository } from './TreeRepository';
import { XFile } from './domain/File';
import { XPath } from './domain/XPath';
import { DebugPhysicalSerializer } from './Serializer';
import { FileDownloader } from './application/FileDownloader';
import { XFolder } from './domain/Folder';
import { FileClonner } from './application/FileClonner';

import mimetypes from './domain/MimeTypesMap.json';

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

  constructor(
    private readonly fileUploader: FileUploader,
    private readonly fileDownloader: FileDownloader,
    private readonly fileClonner: FileClonner,
    private readonly repository: TreeRepository
  ) {
    super(new DebugPhysicalSerializer(fileUploader, repository));

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

    const destinationItem = this.repository.searchItem(pathTo.toString(false));

    if (destinationItem && !ctx.overwrite) {
      Logger.debug('[FS] ITEM ALREADY EXISTS');
      return callback(Errors.ResourceAlreadyExists);
    }

    if (destinationItem && sourceItem.isFile() && destinationItem.isFile()) {
      const overrideFile = async () => {
        const clonnedFileId = await this.fileClonner.clone(sourceItem.fileId);
        const newFile = destinationItem.override(sourceItem, clonnedFileId);

        await this.repository.deleteFile(destinationItem);
        await this.repository.addFile(newFile);

        callback(undefined, true);
      };

      Logger.debug('[FS] OVEWRITING THE FILE');
      overrideFile();
      return;
    }

    if (sourceItem.isFile()) {
      const copyFile = async () => {
        const clonnedFileId = await this.fileClonner.clone(sourceItem.fileId);

        const destinationFolder = this.repository.searchParentFolder(
          pathTo.toString(false)
        );

        if (!destinationFolder) {
          return callback(Errors.IllegalArguments);
        }

        const path = new XPath(pathTo.toString(false));

        const file = XFile.from({
          fileId: clonnedFileId,
          size: sourceItem.size,
          type: sourceItem.type,
          createdAt: sourceItem.createdAt.toISOString(),
          updatedAt: sourceItem.updatedAt.toISOString(),
          modificationTime: sourceItem.modificationTime.toISOString(),
          folderId: destinationFolder.id,
          name: path.name(),
          path: path.value,
        });

        await this.repository.addFile(file);

        callback(undefined, false);
      };

      Logger.debug('[FS] COPING THE FILE');
      copyFile();
      return;
    }
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback): void {
    if (ctx.type.isDirectory) {
      const folderPath = path.toString(false);
      const parent = this.repository.searchParentFolder(folderPath);

      if (!parent) return callback(Errors.InvalidOperation);

      this.repository.createFolder(folderPath, parent).then(() => callback());
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
    const item = this.repository.searchItem(pathLike);

    if (!item) {
      return callback(Errors.ResourceNotFound);
    }

    if (item.isFile()) {
      Logger.debug('[FS] DELETING FILE');
      this.repository
        .deleteFile(item)
        .then(() => callback())
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

    const newFilePaht = new XPath(path.toString(false));

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

        const xPath = new XPath(path.toString(false));

        Logger.debug('new path', xPath.value);

        const file = new XFile(
          fileId,
          parent.id,
          xPath.name(),
          xPath,
          ctx.estimatedSize,
          xPath.extension(),
          new Date(),
          new Date(),
          new Date()
        );

        await this.repository.addFile(file);

        return xPath.value;
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

  private async renameFile(
    originalItem: XFile | XFolder,
    destinationPath: string,
    callback: ReturnCallback<boolean>
  ) {
    const newPath = new XPath(destinationPath);
    const renamedItem = originalItem.rename(newPath);
    try {
      await this.repository.updateName(renamedItem);
      this.repository.deleteCachedItem(originalItem);
      callback(undefined, true);
    } catch {
      callback(Errors.InvalidOperation);
    }
  }

  private moveFile(
    originalItem: XFile,
    destinationPath: string,
    ctx: MoveInfo,
    callback: ReturnCallback<boolean>
  ) {
    const destinationItem = this.repository.searchItem(destinationPath);

    const hasToBeOverriden = destinationItem !== undefined;

    if (hasToBeOverriden && !ctx.overwrite) {
      return callback(Errors.InvalidOperation);
    }

    const destinationFolder =
      this.repository.searchParentFolder(destinationPath);

    if (!destinationFolder) {
      return callback(Errors.IllegalArguments);
    }

    if (originalItem.hasParent(destinationFolder.id)) {
      Logger.debug('FILE RENAME');
      this.renameFile(originalItem, destinationPath, callback);
      return;
    }

    if (hasToBeOverriden) {
      if (originalItem.isFile() && destinationItem?.isFile()) {
        const override = async (callback: ReturnCallback<boolean>) => {
          try {
            const newFile = originalItem.moveTo(destinationFolder);

            await this.repository.deleteFile(destinationItem);
            await this.repository.updateParentDir(newFile);

            callback(undefined, true);
          } catch {
            callback(Errors.UnrecognizedResource);
          }
        };

        override(callback);
        return;
      }

      return callback(Errors.InvalidOperation);
    }

    const simpleMove = async (callback: ReturnCallback<boolean>) => {
      const resultItem = originalItem.moveTo(destinationFolder);

      Logger.debug(
        'NEW PARENT FOLDER: ',
        JSON.stringify(destinationFolder, null, 2)
      );
      Logger.debug('NEW FILE PATH: ', resultItem.path.value);

      this.filesToUpload[resultItem.path.value] = {
        createdAt: resultItem.createdAt.getTime(),
        updatedAt: resultItem.updatedAt.getTime(),
        type: ResourceType.File,
        name: resultItem.name,
        size: resultItem.size,
        extension: resultItem.path.extension(),
        override: false,
      };

      await this.repository.updateParentDir(resultItem).catch((err) => {
        Logger.error('[FS] Error moving a file', JSON.stringify(err, null, 2));
        callback(err);
      });

      this.resources[destinationPath] = this.resources[originalItem.path.value];
      delete this.resources[originalItem.path.value];

      this.repository.deleteCachedItem(originalItem);

      callback(undefined, false);
    };
    Logger.debug('SIMPLE MOVE');
    simpleMove(callback);
  }

  private moveFolder(
    originalFolder: XFolder,
    destinationPath: string,
    ctx: MoveInfo,
    callback: ReturnCallback<boolean>
  ) {
    const destinationItem = this.repository.searchItem(destinationPath);

    const hasToBeOverriden = destinationItem !== undefined;

    if (hasToBeOverriden && !ctx.overwrite) {
      return callback(Errors.InvalidOperation);
    }

    const destinationFolder =
      this.repository.searchParentFolder(destinationPath);

    if (!destinationFolder) {
      return callback(Errors.IllegalArguments);
    }

    if (originalFolder.hasParent(destinationFolder.id)) {
      Logger.debug('FOLDER RENAME');
      this.renameFile(originalFolder, destinationPath, callback);
      return;
    }

    if (hasToBeOverriden) {
      return callback(Errors.Forbidden);
    }

    const simpleFolderMove = async (callback: ReturnCallback<boolean>) => {
      const resultItem = originalFolder.moveTo(destinationFolder);
      await this.repository.updateParentDir(resultItem).catch((err) => {
        Logger.error('[FS] Error moving a file', JSON.stringify(err, null, 2));
        callback(err);
      });

      this.resources[destinationPath] =
        this.resources[originalFolder.path.value];
      delete this.resources[originalFolder.path.value];

      this.repository.deleteCachedItem(originalFolder);

      callback(undefined, false);
    };
    Logger.debug('SIMPLE FOLDER MOVE');
    simpleFolderMove(callback);
  }

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
    if (originalItem.isFile()) {
      return this.moveFile(originalItem, pathTo.toString(false), ctx, callback);
    }
    if (originalItem.isFolder()) {
      Logger.debug('[FS] MOVING FOLDER');
      return this.moveFolder(
        originalItem,
        pathTo.toString(false),
        ctx,
        callback
      );
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
    this.repository.init().then(() => {
      const contents = this.repository.listContents(path.toString(false));
      const paths = contents.map((name) => new Path(name.value));
      callback(undefined, paths);
    });
  }

  _displayName(
    path: Path,
    _ctx: DisplayNameInfo,
    callback: ReturnCallback<string>
  ) {
    Logger.debug('[FS DISPLAY NAME]', path.toString());

    const item = this.repository.searchItem(path.toString(false));

    if (!item) {
      const file = this.filesToUpload[path.toString(false)];

      if (!file) {
        return callback(Errors.ResourceNotFound);
      }

      return callback(undefined, file.name);
    }

    callback(undefined, item.path.nameWithExtension());
  }

  _creationDate(
    path: Path,
    ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ): void {
    Logger.debug('[FS] CREATION DATE');

    const pathLike = path.toString(false);

    const item = this.repository.searchItem(pathLike);

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
    const pathValueObject = new XPath(path.toString(false));

    if (!pathValueObject.hasExtension()) {
      return callback(undefined, InxtFileSystem.DefaultMimeType);
    }

    const mimeType = (mimetypes as Record<string, string>)[
      `.${pathValueObject.extension()}`
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
    const pathLike = path.toString(false);

    const item = this.repository.searchItem(pathLike);

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

    const item = this.repository.searchItem(pathLike);

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

    const pathLike = path.toString(false);

    const item = this.repository.searchItem(pathLike);

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
