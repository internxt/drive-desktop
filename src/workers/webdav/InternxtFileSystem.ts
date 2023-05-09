/* eslint-disable no-underscore-dangle */
import { ResourceType, v2 as webdav } from 'webdav-server';
import {
  FileSystemSerializer,
  ILockManager,
  IPropertyManager,
  LastModifiedDateInfo,
  Path,
  ReadDirInfo,
  ReturnCallback,
  TypeInfo,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';
import { ReadOnlyRemoteRepository } from './ReadOnlyRemoteRepository';

export class InternxtFileSystem extends webdav.FileSystem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected resources: any;

  protected useCache: boolean;

  constructor(
    serializer: FileSystemSerializer,
    private readonly repository: ReadOnlyRemoteRepository
  ) {
    super(serializer);

    // TODO: MOVE IT TO SOMEWHERE WHERE CAN BE AWAITED
    repository.init();

    this.resources = {};
    this.useCache = true;
  }

  getRemotePath(path: Path) {
    const pathStr = path.toString(false);
    if (pathStr === '/') return '';
    else return pathStr;
  }

  getMetaData(
    path: Path,
    callback: ReturnCallback<{
      '.tag': 'file' | 'folder';
      name: string;
      size: number;
    }>
  ) {
    if (
      this.useCache &&
      this.resources[path.toString(false)] &&
      this.resources[path.toString(false)].metadata
    ) {
      callback(undefined, this.resources[path.toString(false)].metadata);
    } else if (path.isRoot()) {
      callback(undefined, {
        '.tag': 'folder',
        name: '',
        size: 0,
      });
    } else {
      callback(undefined, { '.tag': 'file', name: 'test', size: 10 });
    }
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
  // _size(path, ctx, callback) {
  //   this.getMetaData(path, (e, data) => {
  //     if (e) return callback(webdav.Errors.ResourceNotFound);

  //     if (!this.resources[path.toString(false)])
  //       this.resources[path.toString(false)] = {};
  //     this.resources[path.toString(false)].size = data.size;
  //     callback(undefined, data.size);
  //   });
  // }

  _lockManager(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<ILockManager>
  ) {
    Logger.debug('LOCK MANAGER');
    this.getMetaData(path, (e) => {
      if (e) {
        return callback(webdav.Errors.ResourceNotFound);
      }

      if (!this.resources[path.toString(false)])
        this.resources[path.toString(false)] = {};
      if (!this.resources[path.toString(false)].locks)
        this.resources[path.toString(false)].locks =
          new webdav.LocalLockManager();
      callback(undefined, this.resources[path.toString(false)].locks);
    });
  }

  _propertyManager(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<IPropertyManager>
  ) {
    Logger.debug('PROPERTY MANAGER: ', path.toString(false));
    this.getMetaData(path, (e) => {
      if (e) return callback(webdav.Errors.ResourceNotFound);

      if (!this.resources[path.toString(false)])
        this.resources[path.toString(false)] = {};
      if (!this.resources[path.toString(false)].props)
        this.resources[path.toString(false)].props =
          new webdav.LocalPropertyManager({});
      callback(undefined, this.resources[path.toString(false)].props);
    });
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
        return this.repository.get(path.toString(false));
      })
      .then((names) => {
        const paths = names.map((name) => new Path(name));
        Logger.log(JSON.stringify(names, null, 2));
        callback(undefined, names);
      });
  }
  // _creationDate(path, ctx, callback) {
  //   this._lastModifiedDate(path, ctx, callback);
  // }

  _lastModifiedDate(
    path: Path,
    ctx: LastModifiedDateInfo,
    callback: ReturnCallback<number>
  ) {
    Logger.debug('LAST MODIFIED DATE: ', path.toString(false));

    callback(undefined, Date.now());
  }

  _type(path: Path, ctx: TypeInfo, callback: ReturnCallback<ResourceType>) {
    const name = path.toString(false);
    Logger.log('TYPE: ', name);

    if (name === '/') {
      const resource = new ResourceType(false, true);
      callback(undefined, resource);
      return;
    }

    const meta = this.repository.getMetadata(name);
    Logger.debug('META DATA ON TYPE', JSON.stringify(meta, null, 2));
    const resource = new ResourceType(!meta.isFolder, meta.isFolder);
    callback(undefined, resource);

    // if (path.toString(false) === '/') {
    // }
    // const meta = this.repository.getMetadata(path.toString(false));

    // const resource = new ResourceType(!meta.isFolder, meta.isFolder);
    // callback(undefined, resource);
  }
}
