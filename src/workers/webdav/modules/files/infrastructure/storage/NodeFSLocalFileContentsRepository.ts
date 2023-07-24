import { Readable } from 'stream';
import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';
import fs from 'fs/promises';
import { constants, createReadStream } from 'fs';
import path from 'path';
import Logger from 'electron-log';

export class NodeFSLocalFileContentsRepository
  implements LocalFileConentsRepository
{
  private static readonly directory = 'File Cache';

  constructor(private readonly directory: string) {}

  private assemblePath(fileId: string) {
    return path.join(
      this.directory,
      NodeFSLocalFileContentsRepository.directory,
      fileId
    );
  }

  async initialize(): Promise<void> {
    Logger.info('Initializing, file cache...');
    fs.mkdir(
      path.join(this.directory, NodeFSLocalFileContentsRepository.directory)
    );
  }

  async exists(fileId: string): Promise<boolean> {
    try {
      await fs.access(
        this.assemblePath(fileId),
        constants.R_OK | constants.W_OK
      );
      return true;
    } catch {
      return false;
    }
  }

  read(fileId: string): Readable {
    return createReadStream(this.assemblePath(fileId));
  }

  write(fileId: string, content: Readable): Promise<void> {
    return fs.writeFile(this.assemblePath(fileId), content, { flag: 'w' });
  }

  delete(fileId: string): Promise<void> {
    return fs.unlink(this.assemblePath(fileId));
  }

  async usage(): Promise<number> {
    const stats = await fs.stat(this.directory);

    return stats.size;
  }
}
