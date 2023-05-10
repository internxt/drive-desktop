import { v2 as webdav, Lock } from 'webdav-server';
import {
  ILockManager,
  ReturnCallback,
  SimpleCallback,
} from 'webdav-server/lib/index.v2';
import Logger from 'electron-log';

export class MyLockManager implements ILockManager {
  private readonly locks: Array<Lock> = [];

  getLocks(callback: ReturnCallback<Lock[]>): void {
    Logger.debug('[LOCK MANAGER] GET LOCKS');
    callback(undefined, this.locks);
  }

  setLock(lock: Lock, callback: SimpleCallback): void {
    Logger.debug(`[LOCK MANAGER] SET LOCK: `, JSON.stringify(lock, null, 2));
    this.locks.push(lock);
    callback();
  }

  removeLock(_uuid: string, callback: ReturnCallback<boolean>): void {
    Logger.debug('[LOCK MANAGER] REMOVE LOCKS');
    callback(undefined, true);
  }

  getLock(uuid: string, callback: ReturnCallback<Lock>): void {
    Logger.debug('[LOCK MANAGER] GET LOCK');
    throw new Error('Method not implemented.');
  }

  refresh(
    uuid: string,
    timeoutSeconds: number,
    callback: webdav.ReturnCallback<Lock>
  ): void {
    Logger.debug('[LOCK MANAGER] REFRESH');
    throw new Error('Method not implemented.');
  }
}
