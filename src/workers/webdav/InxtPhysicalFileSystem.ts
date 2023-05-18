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
} from 'webdav-server/lib/index.v2';
import { PassThrough, Readable, Writable } from 'stream';
import fs from 'fs';
import p from 'path';
import Logger from 'electron-log';
import { FileUploader } from './application/FileUploader';
import { Repository } from './Repository';
import { XFile } from './domain/File';

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

export class InxtPhysicalFileSystem extends FileSystem {
  resources: {
    [path: string]: PhysicalFileSystemResource;
  };

  emptyFiles: Array<string> = [];

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

  getRealPath(path: Path) {
    const sPath = path.toString();

    return {
      realPath: p.join(this.rootPath, sPath.substr(1)),
      resource: this.resources[sPath],
    };
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback): void {
    // const { realPath } = this.getRealPath(path);

    // const callback = (e: Error | undefined) => {
    //   if (!e)
    //     this.resources[path.toString()] = new PhysicalFileSystemResource();
    //   else if (e) e = Errors.ResourceAlreadyExists;

    //   _callback(e);
    // };

    // if (ctx.type.isDirectory) fs.mkdir(realPath, callback);
    // node v6.* and higher
    this.emptyFiles.push(path.toString());
    callback();
    // fs.open(realPath, fs.constants.O_CREAT, (e: any, fd: any) => {
    //   if (e) return callback(e);
    //   fs.close(fd, callback);
    // });
  }

  // _delete(
  //   path: Path,
  //   ctx: DeleteInfo,
  //   _callback: SimpleCallback
  // ): void {
  //   const { realPath } = this.getRealPath(path);

  //   const callback = (e: Error | undefined) => {
  //     if (!e) delete this.resources[path.toString()];
  //     _callback(e);
  //   };

  //   this.type(ctx.context, path, (e, type) => {
  //     if (e) return callback(Errors.ResourceNotFound);

  //     if (type.isDirectory) {
  //       if (ctx.depth === 0) return fs.rmdir(realPath, callback);

  //       this.readDir(ctx.context, path, (e, files) => {
  //         let nb = files.length + 1;
  //         const done = (e?: Error) => {
  //           if (nb < 0) return;

  //           if (e) {
  //             nb = -1;
  //             return callback(e);
  //           }

  //           if (--nb === 0) fs.rmdir(realPath, callback);
  //         };

  //         files.forEach((file) =>
  //           this.delete(
  //             ctx.context,
  //             path.getChildPath(file),
  //             ctx.depth === -1 ? -1 : ctx.depth - 1,
  //             done
  //           )
  //         );
  //         done();
  //       });
  //     } else fs.unlink(realPath, callback);
  //   });
  // }

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

        const file = XFile.from({
          fileId,
          folderId: parent.id,
          createdAt: Date.now().toLocaleString(),
          modificationTime: Date.now().toLocaleString(),
          name: 'test',
          path: '/test',
          size: ctx.estimatedSize,
          type: 'pdf',
          updatedAt: Date.now().toLocaleString(),
        });
        Logger.debug('FILE', JSON.stringify(file, null, 2));
        this.repository.addFile(
          path.toString(),
          file,
          this.repository.baseFolder
        );
      })
      .catch((err) => Logger.error(JSON.stringify(err, null, 2)));

    callback(undefined, stream);
    // file: PathOrFileDescriptor, data: string | NodeJS.ArrayBufferView, options: WriteFileOptions, callback: NoParamCallback
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ): void {
    const { realPath } = this.getRealPath(path);

    fs.open(realPath, 'r', (e: any, fd: any) => {
      if (e) return callback(Errors.ResourceNotFound);

      callback(undefined, fs.createReadStream(realPath, { fd }));
    });
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
    this.getStatProperty(path, ctx, 'size', callback);
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
    callback(undefined, resource[propertyName]);
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
    const { realPath } = this.getRealPath(path);

    fs.readdir(realPath, (e: any, files: string[] | Path[] | undefined) => {
      callback(e ? Errors.ResourceNotFound : undefined, files);
    });
  }

  getStatProperty(
    path: Path,
    ctx: any,
    propertyName: string,
    callback: ReturnCallback<any>
  ): void {
    const { realPath } = this.getRealPath(path);

    fs.stat(realPath, (e: any, stat: { [x: string]: any }) => {
      if (e) return callback(Errors.ResourceNotFound);

      callback(undefined, stat[propertyName]);
    });
  }

  getStatDateProperty(
    path: Path,
    ctx: any,
    propertyName: string,
    callback: ReturnCallback<number>
  ): void {
    this.getStatProperty(path, ctx, propertyName, (e, value) =>
      callback(e, value ? (value as Date).valueOf() : value)
    );
  }

  _creationDate(
    path: Path,
    ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ): void {
    this.getStatDateProperty(path, ctx, 'birthtime', callback);
  }

  _lastModifiedDate(
    path: Path,
    ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ): void {
    this.getStatDateProperty(path, ctx, 'mtime', callback);
  }

  _type(
    path: Path,
    ctx: TypeInfo,
    callback: ReturnCallback<ResourceType>
  ): void {
    const { realPath } = this.getRealPath(path);

    fs.stat(realPath, (e: any, stat: { isDirectory: () => any }) => {
      if (e) return callback(Errors.ResourceNotFound);

      callback(
        undefined,
        stat.isDirectory() ? ResourceType.Directory : ResourceType.File
      );
    });
  }
}
