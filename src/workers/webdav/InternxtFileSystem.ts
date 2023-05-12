/* eslint-disable no-underscore-dangle */
import { ResourceType, v2 as webdav } from 'webdav-server';
import {
  CreateInfo,
  CreationDateInfo,
  FileSystemSerializer,
  ILockManager,
  IPropertyManager,
  LastModifiedDateInfo,
  LocalLockManager,
  LocalPropertyManager,
  OpenReadStreamInfo,
  Path,
  ReadDirInfo,
  RenameInfo,
  ReturnCallback,
  SizeInfo,
  TypeInfo,
  SimpleCallback,
  DeleteInfo,
  OpenWriteStreamInfo,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';
import { Readable, Writable } from 'stream';
import * as p from 'path';
import { InMemoryRepository } from './InMemoryRepository';
import { MyLockManager } from './LockManager';
import { FileUploader } from './application/FileUploader';

export class InternxtFileSystem extends webdav.FileSystem {
  private readonly lckMNG: ILockManager;

  constructor(
    serializer: FileSystemSerializer,
    private readonly repository: InMemoryRepository,
    private readonly fileUploader: FileUploader
  ) {
    super(serializer);

    this.lckMNG = new MyLockManager();
  }

  _rename(
    pathFrom: Path,
    newName: string,
    ctx: RenameInfo,
    callback: ReturnCallback<boolean>
  ) {
    Logger.debug('RENAME: ', pathFrom, newName, JSON.stringify(ctx, null, 2));
    callback(undefined, false);
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback) {
    Logger.debug('[FS] CREATE');

    const itemPath = path.toString(false);

    try {
      const parent = this.repository.getParentFolder(itemPath);

      if (!parent) {
        callback(new Error('Invalid path when creating a node'));
        return;
      }

      if (ctx.type.isDirectory) {
        Logger.debug('[FS] Creating folder');
        this.repository
          .createFolder(itemPath, parent)
          .then(() => callback())
          .catch((err) => Logger.error(err));
      } else {
        this.repository.createFile(path.toString(false));
        callback();
        Logger.debug('[FS] TMP FILE CREATED');
      }
    } catch (err) {
      Logger.error('[FS] Error: ', JSON.stringify(err, null, 2));
    }
  }

  _delete(path: Path, ctx: DeleteInfo, callback: SimpleCallback) {
    const pathLike = path.toString(false);
    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    if (item.isFile()) {
      Logger.debug('[FS] DELETING FILE');
      callback();
      return;
      // this.repository.deleteFile(iStem).then(() => callback());
    }

    if (item.isFolder()) {
      this.repository.deleteFolder(item).then(() => callback());
    }
  }

  _openWriteStream(
    path: Path,
    ctx: OpenWriteStreamInfo,
    callback: ReturnCallback<Writable>
  ) {
    Logger.debug('[FS] OPEN WRITE STREAM', path);

    const parentItem = this.repository.getParentFolder(path.toString(false));

    if (!parentItem) {
      callback(new Error());
      return;
    }

    const contents: Buffer[] = [];
    const stream = new webdav.VirtualFileWritable(contents);

    const makeThings = async () => {
      const fileId = await this.fileUploader.upload({
        size: ctx.estimatedSize,
        contents,
      });

      const pathLike = path.toString(false);

      const { name, ext } = p.parse(pathLike.split('/').pop() as string);

      const file = {
        fileId,
        folderId: parentItem.id,
        createdAt: new Date(),
        name,
        size: ctx.estimatedSize,
        type: ext,
        updatedAt: new Date(),
      };

      this.repository.addFile(pathLike, file, parentItem);
    };

    stream.on('finish', () => {
      Logger.debug('[FS] FINISHED WRITING STREAM');
      makeThings();
    });
    callback(undefined, stream);
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ) {
    this.repository
      .getReadable(path.toString(false))
      .then((readable) => {
        if (!readable) {
          callback(new Error('EE'));
          return;
        }

        callback(undefined, readable);
      })
      .catch(() => callback(new Error('AA')));
  }

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
    path: Path,
    _ctx: ReadDirInfo,
    callback: ReturnCallback<ILockManager>
  ) {
    Logger.debug('LOCK MANAGER: ', path);
    callback(undefined, this.lckMNG);
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
