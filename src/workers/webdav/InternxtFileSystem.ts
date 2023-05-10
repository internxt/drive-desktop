/* eslint-disable no-underscore-dangle */
import { ResourceType, v2 as webdav } from 'webdav-server';
import {
  CreationDateInfo,
  FileSystemSerializer,
  ILockManager,
  IPropertyManager,
  LastModifiedDateInfo,
  LocalLockManager,
  LocalPropertyManager,
  MimeTypeInfo,
  Path,
  ReadDirInfo,
  ReturnCallback,
  SizeInfo,
  TypeInfo,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';
import { ReadOnlyInMemoryRepository } from './ReadOnlyRemoteRepository';
import { mimetypes } from './mimetypes';

export class InternxtFileSystem extends webdav.FileSystem {
  constructor(
    serializer: FileSystemSerializer,
    private readonly repository: ReadOnlyInMemoryRepository
  ) {
    super(serializer);
  }

  // _rename(pathFrom, newName, ctx, callback) {
  //   this.dbx
  //     .filesMoveV2({
  //       from_path: this.getRemotePath(pathFrom),
  //       to_path: this.getRemotePath(newName),
  //       allow_ownership_transfer: true,
  //       allow_shared_folder: true,
  //     })
  //     .then(() => {
  //       callback(undefined, true);
  //     })
  //     .catch((e) => {
  //       callback(webdav.Errors.InvalidOperation);
  //     });
  // }

  // _create(path, ctx, callback) {
  //   if (ctx.type.isFolder) {
  //     this.dbx
  //       .filesCreateFolderV2({
  //         path: this.getRemotePath(path),
  //       })
  //       .then(() => {
  //         callback();
  //       })
  //       .catch((e) => {
  //         callback();
  //       });
  //   } else {
  //     this.dbx
  //       .filesUpload({
  //         path: this.getRemotePath(path),
  //         contents: 'empty',
  //       })
  //       .then(() => {
  //         callback();
  //       })
  //       .catch((e) => {
  //         callback();
  //       });
  //   }
  // }

  // _delete(path, ctx, callback) {
  //   this.dbx
  //     .filesDelete({
  //       path: this.getRemotePath(path),
  //     })
  //     .then(() => {
  //       delete this.resources[path.toString(false)];
  //       callback();
  //     })
  //     .catch((e) => {
  //       callback();
  //     });
  // }
  // _openWriteStream(path, ctx, callback) {
  //   this.getMetaData(path, (e, data) => {
  //     if (e) {
  //       return callback(webdav.Errors.ResourceNotFound);
  //     }

  //     var content = [];
  //     var stream = new webdav.VirtualFileWritable(content);
  //     stream.on('finish', () => {
  //       this.dbx
  //         .filesUpload({
  //           path: this.getRemotePath(path),
  //           contents: content,
  //           strict_conflict: false,
  //           mode: {
  //             '.tag': 'overwrite',
  //           },
  //         })
  //         .then(() => {})
  //         .catch((e) => {});
  //     });
  //     callback(null, stream);
  //   });
  // }
  // _openReadStream(path, ctx, callback) {
  //   this.dbx
  //     .filesDownload({
  //       path: this.getRemotePath(path),
  //     })
  //     .then((r: any) => {
  //       var stream = new webdav.VirtualFileReadable([r.fileBinary]);
  //       callback(undefined, stream);
  //     })
  //     .catch((e) => {
  //       callback(webdav.Errors.ResourceNotFound);
  //     });
  // }

  _size(path: Path, _ctx: SizeInfo, callback: ReturnCallback<number>) {
    const pathLike = path.toString(false);
    Logger.debug('SIZE: ', pathLike);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    callback(undefined, item.size);
  }

  _lockManager(
    _path: Path,
    _ctx: ReadDirInfo,
    callback: ReturnCallback<ILockManager>
  ) {
    Logger.debug('LOCK MANAGER');
    callback(undefined, new LocalLockManager());
  }

  _propertyManager(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<IPropertyManager>
  ) {
    const pathLike = path.toString(false);
    Logger.debug('PROPERTY MANAGER: ', pathLike);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    callback(undefined, new LocalPropertyManager(item.toProps()));
  }

  _readDir(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<Array<Path> | Array<string>>
  ) {
    Logger.debug('READ DIR');
    this.repository
      .init()
      .then(() => {
        return this.repository.listContents(path.toString(false));
      })
      .then((names) => {
        const paths = names.map((name) => new Path(name.value));
        callback(undefined, paths);
      });
  }

  _creationDate(
    path: Path,
    _ctx: CreationDateInfo,
    callback: ReturnCallback<number>
  ) {
    const pathLike = path.toString(false);
    Logger.debug('LAST MODIFIED DATE: ', pathLike);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    callback(undefined, item.createdAt.getTime());
  }

  _lastModifiedDate(
    path: Path,
    _ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ) {
    const pathLike = path.toString(false);
    Logger.debug('LAST MODIFIED DATE: ', pathLike);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    callback(undefined, item.updatedAt.getTime());
  }

  _type(path: Path, _ctx: TypeInfo, callback: ReturnCallback<ResourceType>) {
    const pathLike = path.toString(false);
    Logger.log('TYPE: ', pathLike);

    if (pathLike === '/') {
      const resource = new ResourceType(false, true);
      callback(undefined, resource);
      return;
    }

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    const resource = new ResourceType(!item.isFolder(), item.isFolder());
    callback(undefined, resource);
  }
}
