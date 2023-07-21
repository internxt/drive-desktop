import { Readable } from 'stream';
import { LocalFileConentsRepository } from '../../domain/LocalFileContentsRepository';
import fs from 'fs/promises';
import { constants, createReadStream } from 'fs';
import path from 'path';

export class NodeFSLocalFileContentsRepository
  implements LocalFileConentsRepository
{
  constructor(private readonly directory: string) {}

  private assemblePath(fileId: string) {
    return path.join(this.directory, fileId);
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
}
