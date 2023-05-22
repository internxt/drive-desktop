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
} from 'webdav-server/lib/index.v2';
import { PassThrough, Readable, Writable } from 'stream';
import Logger from 'electron-log';
import { FileUploader } from './application/FileUploader';
import { Repository } from './Repository';
import { XFile } from './domain/File';
import { XPath } from './domain/XPath';
import { DebugPhysicalSerializer } from './Serializer';
import { FileOverrider } from './application/FileOverrider';

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
  createdAt: Date;
  updatedAt: Date;
  type: ResourceType;
};

export class InxtFileSystem extends FileSystem {
  resources: {
    [path: string]: PhysicalFileSystemResource;
  };

  filesToUpload: Record<string, Metadata> = {};

  constructor(
    private readonly fileUploader: FileUploader,
    private readonly fileOverrider: FileOverrider,
    private readonly repository: Repository
  ) {
    super(new DebugPhysicalSerializer(fileUploader, repository));

    this.resources = {
      '/': new PhysicalFileSystemResource(),
    };
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback): void {
    Logger.debug('CREATE');
    if (ctx.type.isDirectory) {
      const folderPath = path.toString(false);
      const parent = this.repository.getParentFolder(folderPath);

      if (!parent) return callback(Errors.InvalidOperation);

      this.repository.createFolder(folderPath, parent).then(() => callback());
      return;
    }

    if (ctx.type.isFile) {
      this.filesToUpload[path.toString()] = {
        createdAt: new Date(),
        updatedAt: new Date(),
        type: new ResourceType(true, false),
      };

      return callback();
    }

    callback(Errors.InvalidOperation);
  }

  _delete(path: Path, ctx: DeleteInfo, callback: SimpleCallback): void {
    const pathLike = path.toString(false);
    const item = this.repository.searchItem(pathLike);

    if (!item) {
      Logger.debug('SOMETING NOT FOUND ON DELTET', path.toString());
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
    const resource = this.resources[path.toString()];

    if (!resource) {
      this.resources[path.toString()] = new PhysicalFileSystemResource();
    }

    const stream = new PassThrough();

    Logger.debug('WRITE STEAM ON ', path.toString(false));

    this.fileUploader
      .upload({
        size: ctx.estimatedSize,
        contents: stream,
      })
      .then((fileId: string) => {
        const parent = this.repository.getParentFolder(path.toString(false));

        if (!parent) {
          return;
        }

        const xPath = new XPath(path.toString(false));

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
        Logger.debug('FILE', JSON.stringify(file, null, 2));
        this.repository.addFile(file);
      })
      .catch((err) => Logger.error(JSON.stringify(err, null, 2)));

    callback(undefined, stream);
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    Logger.debug('[OPEN READ STREAM]');
    this.repository
      .getReadable(path.toString(false))
      .then((readable) => {
        if (!readable) {
          return callback(Errors.UnrecognizedResource);
        }

        callback(undefined, readable);
      })
      .catch(() => callback(Errors.UnrecognizedResource));
  }

  _move(
    pathFrom: Path,
    pathTo: Path,
    ctx: MoveInfo,
    callback: ReturnCallback<boolean>
  ): void {
    const originalItem = this.repository.searchItem(pathFrom.toString(false));

    if (!originalItem) {
      return callback(Errors.ResourceNotFound);
    }

    const destinationItem = this.repository.searchItem(pathTo.toString(false));

    if (destinationItem && !ctx.overwrite) {
      return callback(Errors.InvalidOperation);
    }

    const destinationFolder = this.repository.getParentFolder(
      pathTo.toString(false)
    );

    if (!destinationFolder) {
      return callback(Errors.IllegalArguments);
    }

    if (originalItem.isFile()) {
      if (originalItem.hasParent(destinationFolder.id)) {
        // Rename
        return;
      }
    }

    const fileToOverride = this.repository.searchItem(pathTo.toString(false));

    if (fileToOverride) {
      if (!ctx.overwrite) {
        return callback(Errors.InvalidOperation);
      }

      if (fileToOverride.isFolder()) {
        return callback(Errors.InvalidOperation);
      }

      const overrideFile = async () => {
        const fileId = await this.fileOverrider.run(fileToOverride);
        const path = new XPath(pathTo.toString(false));

        // TODO: should the modification time change?
        const file = new XFile(
          fileId,
          destinationFolder.id,
          path.name(),
          path,
          originalItem.size,
          path.extension(),
          originalItem.createdAt,
          new Date(),
          new Date()
        );

        await this.repository.addFile(file);
      };

      overrideFile()
        .then(() => {
          callback(undefined, true);
        })
        .catch((err) => {
          Logger.error('[FS] Error overriding a file: ', err);
          callback(err);
        });
      return;
    }

    const resultItem = originalItem.moveTo(destinationFolder);

    this.repository
      .updateParentDir(resultItem)
      .then(() => callback(undefined, false))
      .catch((err) => {
        Logger.error('[FS] Error moving a file', JSON.stringify(err, null, 2));
        callback(err);
      });

    // const { realPath: realPathFrom } = this.getRealPath(pathFrom);
    // const { realPath: realPathTo } = this.getRealPath(pathTo);

    // const rename = (overwritten: boolean | undefined) => {
    //   fs.rename(realPathFrom, realPathTo, (er: Error | undefined) => {
    //     if (er) return callback(er);

    //     this.resources[realPathTo] = this.resources[realPathFrom];
    //     delete this.resources[realPathFrom];
    //     callback(undefined, overwritten);
    //   });
    // };

    // fs.access(realPathTo, (e: any) => {
    //   if (e) {
    //     // destination doesn't exist
    //     rename(false);
    //   } else {
    //     // destination exists
    //     if (!ctx.overwrite) return callback(Errors.ResourceAlreadyExists);

    //     this.delete(ctx.context, pathTo, (er) => {
    //       if (er) return callback(er);
    //       rename(true);
    //     });
    //   }
    // });
  }

  _size(path: Path, ctx: SizeInfo, callback: ReturnCallback<number>): void {
    Logger.debug('[FS] SIZE', path.toString());

    const pathLike = path.toString(false);

    const item = this.repository.searchItem(pathLike);

    if (!item) {
      callback(Errors.BadAuthentication);
      return;
    }

    callback(undefined, item.size);
  }

  /**
   * Get a property of an existing resource (object property, not WebDAV property). If the resource doesn't exist, it is created.
   *
   * @param path Path of the resource
   * @param ctx Context of the method
   * @param propertyName Name of the property to get from the resource
   * @param callback Callback returning the property object of the resource
   */
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

    Logger.debug('PRPERTY NAME', propertyName);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const property = resource[propertyName];

    Logger.debug('PRPERTIES', JSON.stringify(property, null, 2));

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

  // getStatProperty(
  //   path: Path,
  //   ctx: any,
  //   propertyName: string,
  //   callback: ReturnCallback<any>
  // ): void {
  //   const { realPath } = this.getRealPath(path);

  //   fs.stat(realPath, (e: any, stat: { [x: string]: any }) => {
  //     if (e) return callback(Errors.ResourceNotFound);

  //     callback(undefined, stat[propertyName]);
  //   });
  // }

  // getStatDateProperty(
  //   path: Path,
  //   ctx: any,
  //   propertyName: string,
  //   callback: ReturnCallback<number>
  // ): void {
  //   this.getStatProperty(path, ctx, propertyName, (e, value) =>
  //     callback(e, value ? (value as Date).valueOf() : value)
  //   );
  // }

  _displayName(
    path: Path,
    _ctx: DisplayNameInfo,
    callback: ReturnCallback<string>
  ) {
    Logger.debug('[FS DISPLAY NAME]', path.toString());

    const item = this.repository.searchItem(path.toString(false));

    if (!item) {
      return callback(Errors.ResourceNotFound);
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
      const temporal = this.filesToUpload[path.toString()];
      if (!temporal) {
        Logger.debug('SOMETING NOT FOUND CREATION DATE', path.toString());
        callback(Errors.ResourceNotFound);
        return;
      }

      return callback(undefined, temporal.createdAt.getDate());
    }

    callback(undefined, item.createdAt.getTime());
  }

  _lastModifiedDate(
    path: Path,
    ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ): void {
    const pathLike = path.toString(false);

    const item = this.repository.searchItem(pathLike);

    if (!item) {
      const temporal = this.filesToUpload[pathLike];

      if (!temporal) {
        callback(Errors.ResourceNotFound);
        return;
      }

      return callback(undefined, temporal.updatedAt.getDate());
    }

    callback(undefined, item.updatedAt.getTime());
  }

  _type(
    path: Path,
    ctx: TypeInfo,
    callback: ReturnCallback<ResourceType>
  ): void {
    Logger.debug('[FS] TYPE');

    const pathLike = path.toString(false);

    if (pathLike === '/') {
      const resource = new ResourceType(false, true);
      callback(undefined, resource);
      return;
    }

    const item = this.repository.searchItem(pathLike);

    if (!item) {
      const temporal = this.filesToUpload[path.toString(false)];

      if (!temporal) {
        callback(Errors.ResourceNotFound);
        return;
      }

      return callback(undefined, temporal.type);
    }

    const resource = new ResourceType(item.isFile(), item.isFolder());
    callback(undefined, resource);
  }
}
