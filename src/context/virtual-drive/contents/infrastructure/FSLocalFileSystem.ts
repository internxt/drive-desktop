import { ensureFolderExists } from '../../../../apps/shared/fs/ensure-folder-exists';
import { WriteReadableToFile } from '../../../../apps/shared/fs/write-readable-to-file';
import { LocalFileContents } from '../domain/LocalFileContents';
import { LocalFileContentsDirectoryProvider } from '../../shared/domain/LocalFileContentsDirectoryProvider';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import path from 'path';
import fs from 'fs/promises';
import { ContentsId } from '../domain/ContentsId';
import { ContentsMetadata } from '../domain/ContentsMetadata';

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

  async remove(contentsId: ContentsId): Promise<void> {
    const folder = await this.baseFolder();

    const absolutePath = path.join(folder, contentsId.value);
    return fs.rm(absolutePath);
  }

  async exists(contentsId: ContentsId): Promise<boolean> {
    const folder = await this.baseFolder();

    const absolutePath = path.join(folder, contentsId.value);

    try {
      await fs.stat(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  async metadata(contentsId: ContentsId) {
    const folder = await this.baseFolder();

    const absolutePath = path.join(folder, contentsId.value);

    const { mtimeMs } = await fs.stat(absolutePath);

    return ContentsMetadata.from({ modificationDate: new Date(mtimeMs) });
  }

  async add(contentsId: ContentsId, source: string): Promise<void> {
    const folder = await this.baseFolder();

    const destination = path.join(folder, contentsId.value);

    await fs.rename(source, destination);
  }

  async listExistentFiles(): Promise<Array<ContentsId>> {
    const folder = await this.baseFolder();

    const names = await fs.readdir(folder);

    return Promise.all(
      names
        .filter(async (name) => {
          const fullPath = path.join(folder, name);
          const stat = await fs.stat(fullPath);

          return stat.isFile();
        })
        .map(async (name) => {
          return new ContentsId(name);
        })
    );
  }
}
