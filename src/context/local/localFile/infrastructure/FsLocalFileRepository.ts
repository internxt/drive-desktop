import { Service } from 'diod';
import { LocalFileRepository } from '../domain/LocalFileRepository';
import { LocalFile } from '../domain/LocalFile';
import { AbsolutePath } from './AbsolutePath';
import fs from 'fs/promises';
import path from 'path';

@Service()
export class FsLocalFileRepository implements LocalFileRepository {
  async files(absolutePath: AbsolutePath): Promise<LocalFile[]> {
    const dirents = await fs.readdir(absolutePath, {
      withFileTypes: true,
    });

    const conversion = dirents
      .filter((dirent) => dirent.isFile())
      .map(async (file) => {
        const fileAbsolutePath = path.join(
          absolutePath,
          file.name
        ) as AbsolutePath;

        const { mtime, size } = await fs.stat(fileAbsolutePath);

        return LocalFile.from({
          size: size,
          path: fileAbsolutePath,
          modificationTime: mtime.getTime(),
        });
      });

    const files = await Promise.all(conversion);

    return files;
  }

  async folders(absolutePath: AbsolutePath): Promise<AbsolutePath[]> {
    const dirents = await fs.readdir(absolutePath, { withFileTypes: true });

    return dirents
      .filter((dirent) => dirent.isDirectory())
      .map((folder) => path.join(absolutePath, folder.name) as AbsolutePath);
  }
}
