import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileContentsDirectoryProvider } from '../../shared/domain/LocalFileContentsDirectoryProvider';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import path from 'path';
import fs from 'fs/promises';
import Logger from 'electron-log';

export class FSLocalFileSystem implements LocalFileSystem {
  constructor(
    private readonly locationProvider: LocalFileContentsDirectoryProvider,
    private readonly subfolder: string
  ) {}

  private async baseFolder(): Promise<string> {
    const location = await this.locationProvider.provide();

    return path.join(location, this.subfolder);
  }

  async write(contents: LocalFileContents, name?: string): Promise<string> {
    const folderPath = await this.baseFolder();
    ensureFolderExists(folderPath);

    const fileName = name || contents.nameWithExtension;

    const filePath = path.join(folderPath, fileName);

    await WriteReadableToFile.write(contents.stream, filePath);

    return filePath;
  }

  async remove(relativePath: string): Promise<void> {
    const folder = await this.baseFolder();

    const absolutePath = path.join(folder, relativePath);
    Logger.debug(' delete path,', absolutePath);
    return fs.rm(absolutePath);
  }

  async exists(relativePath: string): Promise<boolean> {
    const folder = await this.baseFolder();

    const absolutePath = path.join(folder, relativePath);

    try {
      Logger.debug(' exists path,', absolutePath);
      await fs.stat(absolutePath);
      return true;
    } catch {
      return false;
    }
  }
}
