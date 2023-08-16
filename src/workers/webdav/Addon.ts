//Temporal
import Logger from 'electron-log';

export interface VirtualDrive {
  PLACEHOLDER_ATTRIBUTES: { [key: string]: number };

  convertToWindowsTime(jsTime: number): bigint;

  connectSyncRoot(path: string): any;

  createPlaceholderFile(
    fileName: string,
    fileId: string,
    fileSize: number,
    fileAttributes: number,
    creationTime: number,
    lastWriteTime: number,
    lastAccessTime: number,
    path: string
  ): any;

  registerSyncRoot(
    path: string,
    providerName: string,
    providerVersion: string,
    providerId: string
  ): any;

  unregisterSyncRoot(path: string): any;

  watchAndWait(path: string): any;
}

export class DumbVirtualDrive implements VirtualDrive {
  PLACEHOLDER_ATTRIBUTES: { [key: string]: number } = {};

  convertToWindowsTime(jsTime: number): bigint {
    Logger.info('called convertToWindowsTime with', jsTime);
    return 0 as unknown as bigint;
  }
  connectSyncRoot(path: string) {
    Logger.info('called connectSyncRoot with', path);
  }

  createPlaceholderFile(
    fileName: string,
    fileId: string,
    fileSize: number,
    fileAttributes: number,
    creationTime: number,
    lastWriteTime: number,
    lastAccessTime: number,
    path: string
  ) {
    Logger.info('called createPlaceholderFile with ', {
      fileName,
      fileId,
      fileSize,
      fileAttributes,
      creationTime,
      lastWriteTime,
      lastAccessTime,
      path,
    });
  }
  registerSyncRoot(
    path: string,
    providerName: string,
    providerVersion: string,
    providerId: string
  ) {
    Logger.debug('called registerSyncRoot with: ', {
      path,
      providerName,
      providerVersion,
      providerId,
    });
  }
  unregisterSyncRoot(path: string) {
    Logger.debug('called unregisterSyncRoot with', path);
  }
  watchAndWait(path: string) {
    Logger.debug('called watchAndWait with', path);
  }
}
