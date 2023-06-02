import {
  FileSystem,
  IStorageManager,
  IStorageManagerEvaluateCallback,
  Path,
  PropertyAttributes,
  RequestContext,
  ResourcePropertyValue,
  ResourceType,
} from 'webdav-server/lib/index.v2';
import { InternxtStorageManagerDepencyContainer } from './InternxtStorageManagerDepencyContainer';
import Logger from 'electron-log';

export class InternxtStorageManager implements IStorageManager {
  constructor(
    private readonly dependencies: InternxtStorageManagerDepencyContainer
  ) {}

  reserve(
    _ctx: RequestContext,
    _fs: FileSystem,
    _size: number,
    callback: (reserved: boolean) => void
  ): void {
    callback(true);
  }

  evaluateCreate(
    _ctx: RequestContext,
    _fs: FileSystem,
    _path: Path,
    _type: ResourceType,
    callback: IStorageManagerEvaluateCallback
  ): void {
    callback(0);
  }
  evaluateContent(
    _ctx: RequestContext,
    _fs: FileSystem,
    _expectedSize: number,
    callback: IStorageManagerEvaluateCallback
  ): void {
    callback(0);
  }
  evaluateProperty(
    _ctx: RequestContext,
    _fs: FileSystem,
    _name: string,
    _value: ResourcePropertyValue,
    _attributes: PropertyAttributes,
    callback: IStorageManagerEvaluateCallback
  ): void {
    callback(0);
  }

  available(
    _ctx: RequestContext,
    _fs: FileSystem,
    callback: (available: number) => void
  ): void {
    this.dependencies.freeUsageCalculator
      .run()
      .then((space) => {
        callback(space);
      })
      .catch(() => {
        Logger.error('Error getting avaliable space');
        callback(0);
      });
  }
  reserved(
    _ctx: RequestContext,
    _fs: FileSystem,
    callback: (reserved: number) => void
  ): void {
    this.dependencies.userUsageRepository
      .getUsage()
      .then((usage) => {
        callback(usage.totalInUse());
      })
      .catch(() => {
        Logger.error('Error getting used space');
        callback(0);
      });
  }
}
