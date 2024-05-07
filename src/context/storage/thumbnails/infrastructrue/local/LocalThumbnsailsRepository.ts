import { Service } from 'diod';
import Logger from 'electron-log';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { File } from '../../../../virtual-drive/files/domain/File';
import { Thumbnail } from '../../domain/Thumbnail';
import { ThumbnailCollection } from '../../domain/ThumbnailCollection';
import { ThumbnailsRepository } from '../../domain/ThumbnailsRepository';
import { SystemThumbnailNameCalculator } from './SystemThumbnailNameCalculator';
import { RelativePathToAbsoluteConverter } from '../../../../virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { WriteReadableToFile } from '../../../../../apps/shared/fs/write-readable-to-file';

const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
  error instanceof Error;

@Service()
export class LocalThumbnailRepository implements ThumbnailsRepository {
  constructor(
    private readonly absolutePathConverter: RelativePathToAbsoluteConverter,
    private readonly systemThumbnailNameCalculator: SystemThumbnailNameCalculator,
    private readonly systemThumbnailsFolder: string
  ) {}

  private obtainName(file: File): string {
    const absolutePath = this.absolutePathConverter.run(file.path);
    const uri = `file://${absolutePath}`;

    return this.systemThumbnailNameCalculator.thumbnailName(uri);
  }

  async retrieve(file: File): Promise<ThumbnailCollection | undefined> {
    const name = this.obtainName(file);

    try {
      const stat = fs.statSync(
        path.join(this.systemThumbnailsFolder, 'normal', name)
      );

      const thumbnail = Thumbnail.from({
        id: undefined,
        contentsId: undefined,
        bucket: undefined,
        type: path.extname(name),
        updatedAt: stat.mtime,
      });

      return new ThumbnailCollection(file, [thumbnail]);
    } catch (error) {
      if (isNodeError(error) && error.code !== 'ENOENT') {
        // The thumbnail not existing is not an error
        Logger.error((error as Error).message);
      }

      return undefined;
    }
  }

  async push(file: File, stream: Readable): Promise<void> {
    const name = this.obtainName(file);

    const were = path.join(this.systemThumbnailsFolder, 'normal', name);

    await WriteReadableToFile.write(stream, were);

    Logger.info(`Thumbnail Created for ${file.nameWithExtension} on ${were}`);
  }

  pull(_thumbnail: Thumbnail): Promise<Readable> {
    throw new Error('Method not implemented.');
  }
}
