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
  MoveInfo,
  TypeInfo,
  Path,
  Errors,
  PhysicalSerializer,
  ETagInfo,
} from 'webdav-server/lib/index.v2';
import { PassThrough, Readable, Writable } from 'stream';
import fs from 'fs';
import p from 'path';
import Logger from 'electron-log';
import { FileUploader } from './application/FileUploader';
import { Repository } from './Repository';
import { XFile } from './domain/File';
import { XPath } from './domain/XPath';

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
};

export class InxtPhysicalFileSystem extends FileSystem {
  resources: {
    [path: string]: PhysicalFileSystemResource;
  };

  filesToUpload: Record<string, Metadata> = {};

  constructor(
    public rootPath: string,
    private readonly fileUploader: FileUploader,
    private readonly repository: Repository
  ) {
    super(new PhysicalSerializer());

    this.resources = {
      '/': new PhysicalFileSystemResource(),
    };
  }

  // getRealPath(path: Path) {
  //   const sPath = path.toString();

  //   return {
  //     realPath: p.join(this.rootPath, sPath.substr(1)),
  //     resource: this.resources[sPath],
  //   };
  // }

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
      };
      return callback();
    }

    callback(Errors.InvalidOperation);
  }

  _delete(path: Path, ctx: DeleteInfo, callback: SimpleCallback): void {
    const pathLike = path.toString(false);
    const item = this.repository.getItem(pathLike);

    if (!item) {
      Logger.debug('SOMETING NOT FOUND ON DELTET', path.toString());
      return callback(Errors.ResourceNotFound);
    }

    if (item.isFile()) {
      Logger.debug('[FS] DELETING FILE');
      this.repository
        .deleteFile(item)
        .then(() => callback())
        .catch(() => callback(Errors.None));
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
        this.repository.addFile(
          path.toString(),
          file,
          this.repository.baseFolder
        );
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

  // _move(
  //   pathFrom: Path,
  //   pathTo: Path,
  //   ctx: MoveInfo,
  //   callback: ReturnCallback<boolean>
  // ): void {
  //   const { realPath: realPathFrom } = this.getRealPath(pathFrom);
  //   const { realPath: realPathTo } = this.getRealPath(pathTo);

  //   const rename = (overwritten: boolean | undefined) => {
  //     fs.rename(realPathFrom, realPathTo, (er: Error | undefined) => {
  //       if (er) return callback(er);

  //       this.resources[realPathTo] = this.resources[realPathFrom];
  //       delete this.resources[realPathFrom];
  //       callback(undefined, overwritten);
  //     });
  //   };

  //   fs.access(realPathTo, (e: any) => {
  //     if (e) {
  //       // destination doesn't exist
  //       rename(false);
  //     } else {
  //       // destination exists
  //       if (!ctx.overwrite) return callback(Errors.ResourceAlreadyExists);

  //       this.delete(ctx.context, pathTo, (er) => {
  //         if (er) return callback(er);
  //         rename(true);
  //       });
  //     }
  //   });
  // }

  _size(path: Path, ctx: SizeInfo, callback: ReturnCallback<number>): void {
    Logger.debug('[FS] SIZE');

    const pathLike = path.toString(false);

    const item = this.repository.getItem(pathLike);

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

  _creationDate(
    path: Path,
    ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ): void {
    Logger.debug('[FS] CREATION DATE');

    const pathLike = path.toString(false);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      Logger.debug('SOMETING NOT FOUND CREATION DATE', path.toString());
      callback(Errors.ResourceNotFound);
      return;
    }

    callback(undefined, item.createdAt.getTime());
  }

  _lastModifiedDate(
    path: Path,
    ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ): void {
    Logger.debug('[FS] LAST MODIFIED DATE');
    const pathLike = path.toString(false);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(Errors.InvalidOperation);
      return;
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

    const item = this.repository.getItem(pathLike);

    if (!item) {
      Logger.debug('SOMETING NOT FOUND ON TYPE', path.toString());
      callback(Errors.ResourceNotFound);
      return;
    }

    const resource = new ResourceType(!item.isFolder(), item.isFolder());
    callback(undefined, resource);
  }
}
