/* eslint-disable no-underscore-dangle */
import { v2 as webdav } from 'webdav-server';
import {
  CreateInfo,
  CreationDateInfo,
  FileSystemSerializer,
  ILockManager,
  IPropertyManager,
  LastModifiedDateInfo,
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
  CopyInfo,
  MoveInfo,
  Errors,
  LockKind,
  AvailableLocksInfo,
  RequestContext,
  ResourceType,
  LocalLockManager,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';
import { PassThrough, Readable, Writable } from 'stream';
import * as p from 'path';
import fs, { createWriteStream } from 'fs';
import { Repository } from './Repository';
import { MyLockManager } from './LockManager';
import { FileUploader } from './application/FileUploader';
import { XPath } from './domain/XPath';
import { XFile } from './domain/File';
import { XFolder } from './domain/Folder';
import { FileClonner } from './application/FileClonner';
import { DebugPropertyManager } from './DebugPropertyManager';

export class InternxtFileSystem extends webdav.FileSystem {
  private readonly lckMNG: ILockManager;

  private temporalFiles: Record<string, Writable | null> = {};

  private locks: Record<string, ILockManager> = {};

  constructor(
    serializer: FileSystemSerializer,
    private readonly repository: Repository,
    private readonly fileUploader: FileUploader,
    private readonly fileClonner: FileClonner
  ) {
    super(serializer);

    this.lckMNG = new MyLockManager();
  }

  _availableLocks(
    path: Path,
    ctx: AvailableLocksInfo,
    callback: ReturnCallback<LockKind[]>
  ) {
    Logger.debug('[FS AVAILABLE LOCKS]');
  }

  // Called when moving file
  _fastExistCheck(
    ctx: RequestContext,
    path: Path,
    callback: (exists: boolean) => void
  ) {
    // Logger.debug('[FS FAST EXIST CHECK');
    const item = this.repository.getItem(path.toString(false));

    if (!item) callback(false);

    callback(true);
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

  private customRename(
    item: XFile | XFolder,
    pathTo: Path,
    callback: ReturnCallback<boolean>
  ) {
    const newPath = new XPath(pathTo.toString(false));

    const renamed = item.rename(newPath);

    this.repository
      .updateName(renamed)
      .then(() => {
        callback(undefined, true);
      })
      .catch((err) => {
        Logger.debug('[FS MOVE] ERROR RENAMING', JSON.stringify(err));
        callback(err);
      });
  }

  private customMove(
    item: XFile | XFolder,
    pathTo: Path,
    callback: ReturnCallback<boolean>
  ) {
    if (this.repository.getItem(pathTo.toString(false))) {
      callback(Errors.InvalidOperation);
      return;
    }

    const newPath = new XPath(pathTo.toString(false));

    const folder = this.repository.getItem(newPath.dirname());

    if (!folder) {
      callback(Errors.ResourceNotFound);
      return;
    }

    if (!folder.isFolder()) {
      callback(Errors.InvalidOperation);
      return;
    }

    Logger.debug('BEFORE ', JSON.stringify(item, null, 2));

    const moved = item.moveTo(folder);
    Logger.debug('AFTER ', JSON.stringify(moved, null, 2));

    this.repository
      .updateParentDir(moved)
      .then(() => callback(undefined, true))
      .catch((err) => {
        Logger.debug('[FS MOVE] ERROR MOVING', JSON.stringify(err));
        callback(err);
      });
  }

  _move(
    pathFrom: Path,
    pathTo: Path,
    _ctx: MoveInfo,
    callback: ReturnCallback<boolean>
  ) {
    Logger.debug('[FS MOVE]');
    const fromParent = pathFrom.getParent().toString(false);
    const toParent = pathTo.getParent().toString(false);

    const item = this.repository.getItem(pathFrom.toString(false));

    if (!item) {
      callback(Errors.ResourceNotFound);
      return;
    }

    if (fromParent === toParent) {
      Logger.debug('GOING TO RENAME');
      this.customRename(item, pathTo, callback);
      return;
    }

    Logger.debug('GOING TO MOVE', pathTo.toString(false));
    this.customMove(item, pathTo, callback);
  }

  _copy(
    pathFrom: Path,
    pathTo: Path,
    ctx: CopyInfo,
    callback: ReturnCallback<boolean>
  ) {
    Logger.debug('[FS] COPY');

    const item = this.repository.getItem(pathFrom.toString(false)) as XFile;

    const fn = async () => {
      const id = await this.fileClonner.clone(item.fileId);

      const parent = this.repository.getParentFolder(item.path.value);

      if (!parent) {
        Logger.debug('[FS] COPY NO PARENT FOUND');
        throw new Error();
      }

      const file = item.clone(id, new XPath(pathTo.toString()));
      await this.repository.addFile(pathTo.toString(false), file, parent);
    };

    fn()
      .then(() => callback(undefined, true))
      .catch(() => callback(Errors.IllegalArguments));
  }

  _create(path: Path, ctx: CreateInfo, callback: SimpleCallback) {
    Logger.debug('[FS] CREATE');

    const itemPath = path.toString(false);

    const createFolder = async (parent: XFolder) => {
      try {
        Logger.debug('[FS] CREATE B');
        callback(undefined);
        await this.repository.createFolder(itemPath, parent);
        Logger.debug('[FS] CREATE A');
      } catch (err) {
        callback(Errors.InsufficientStorage);
      }
    };

    try {
      const parent = this.repository.getParentFolder(itemPath);
      Logger.debug('[FS] CREATE PARENT: ', JSON.stringify(parent, null, 2));
      if (!parent) {
        callback(Errors.InvalidOperation);
        return;
      }

      if (ctx.type.isDirectory) {
        createFolder(parent);
        return;
      } else {
        this.temporalFiles[path.toString(false)] = null;
        // this.repository.createFile(path.toString(false));
        callback();
        Logger.debug('[FS] TMP FILE CREATED');
      }
    } catch (err) {
      Logger.error('[FS] Error: ', JSON.stringify(err, null, 2));
    }
  }

  _delete(path: Path, ctx: DeleteInfo, callback: SimpleCallback) {
    Logger.debug('DELTE');
  }

  _openWriteStream(
    path: Path,
    ctx: OpenWriteStreamInfo,
    callback: ReturnCallback<Writable>
  ) {
    Logger.debug('[FS] OPEN WRITE STREAM', path);

    const temporalFileWrittable = this.temporalFiles[path.toString(false)];

    if (temporalFileWrittable) {
      Logger.debug('Already exist the stream');
      callback(undefined, temporalFileWrittable);
      return;
    }

    const parentItem = this.repository.getParentFolder(path.toString(false));

    if (!parentItem) {
      callback(Errors.IllegalArguments);
      return;
    }

    const uploadNewFile = async (contents: Readable) => {
      Logger.debug('[CONTENTS]');

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
        type: ext.slice(1),
        updatedAt: new Date(),
      };

      await this.repository.addFile(pathLike, file, parentItem);
    };

    const renameFile = async () => {
      if (ctx.mode !== 'mustExist') {
        return;
      }
      Logger.debug('[FS] RENAMING ');
      Logger.debug('[FS] PATH ', path.toString(false));
      Logger.debug('[FS] TMP ', JSON.stringify(this.temporalFiles, null, 2));
    };

    const contents: Buffer[] = [];
    // const stream = new webdav.VirtualFileWritable(contents);
    // const passThrough = new PassThrough();
    const stream = createWriteStream('/tmp');
    this.temporalFiles[path.toString(false)] = stream;

    // const multiplexer = multipipe(readable, writable);

    // multiplexer.on('error', (error) => {
    //   Logger.error('Error in the multiplexor: ', error);
    // });

    // multiplexer.on('finish', () => {
    //   Logger.debug('Multiplexor finished successfully.');
    // });

    this.temporalFiles[path.toString(false)] = stream;

    if (ctx.mode === 'mustCreate') {
      Logger.debug('UPLOADING FILE');
      // multiplexer.resume();

      // uploadNewFile(passThrough);
    }

    callback(undefined, stream);

    stream.once('finish', () => {
      Logger.debug('[FS] FINISHED WRITING STREAM');

      if (ctx.mode === 'mustExist') {
        Logger.debug('RENAMING FILE');
        renameFile();
      }
    });
  }

  _openReadStream(
    path: Path,
    ctx: OpenReadStreamInfo,
    callback: ReturnCallback<Readable>
  ) {
    Logger.debug('[OPEN READ STREAM]');
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

    const item = this.repository.getItem(path.toString(false));

    if (!item) {
      callback(Errors.ResourceNotFound);
      return;
    }

    if (!this.locks[item.path.value]) {
      this.locks[item.path.value] = new LocalLockManager();
    }

    callback(undefined, this.locks[item.path.value]);
  }

  _propertyManager(
    path: Path,
    ctx: ReadDirInfo,
    callback: ReturnCallback<IPropertyManager>
  ) {
    const pathLike = path.toString(false);

    const item = this.repository.getItem(pathLike);

    if (!item) {
      callback(new Error(`Item ${pathLike} not found`));
      return;
    }

    callback(undefined, new DebugPropertyManager(item.toProps()));
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
        paths.forEach((ddd: Path) => {
          this.locks[ddd.toString(false)] = new LocalLockManager();
        });
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
