import { Service } from 'diod';
import Logger from 'electron-log';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { WriteReadableToFile } from '../../../../../apps/shared/fs/write-readable-to-file';
import { File } from '../../../../virtual-drive/files/domain/File';
import { RelativePathToAbsoluteConverter } from '../../../../virtual-drive/shared/application/RelativePathToAbsoluteConverter';
import { Thumbnail } from '../../domain/Thumbnail';
import { ThumbnailCollection } from '../../domain/ThumbnailCollection';
import { ThumbnailsRepository } from '../../domain/ThumbnailsRepository';
import { SystemThumbnailNameCalculator } from './SystemThumbnailNameCalculator';

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

  has(file: File): Promise<boolean> {
    const name = this.obtainName(file);

    const were = path.join(this.systemThumbnailsFolder, 'normal', name);

    return new Promise((resolve) => {
      fs.stat(were, (err) => {
        resolve(err === null);
      });
    });
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

  private getIconName(mimetype: string): string | undefined {
    const parts = mimetype.split('/');

    switch (parts[0]) {
      case 'audio':
        return 'audio-x-generic';
      case 'image':
        return 'audio-x-generic';
      case 'text':
        return 'text-x-generic';
      case 'video':
        return 'video-x-generic';
      case 'application':
        switch (parts[1]) {
          case 'json':
            return 'text-x-script';
          case 'vnd.oasis.opendocument.database':
            return 'model';
          case 'vnd.oasis.opendocument.chart':
          case 'vnd.oasis.opendocument.presentation':
            return 'x-office-presentation';
          case 'vnd.oasis.opendocument.formula':
          case 'vnd.oasis.opendocument.spreadsheet':
            return 'x-office-spreadsheet';
          case 'vnd.oasis.opendocument.graphics':
          case 'vnd.oasis.opendocument.image':
            return 'x-office-drawing';
          case 'vnd.oasis.opendocument.text-master':
          case 'vnd.oasis.opendocument.text':
            return 'x-office-document';
          case 'x-rar-compressed':
          case 'zip':
            return undefined;
        }
        if (parts[1] === 'pdf') return 'x-office-document';
        return 'application-x-executable';
      default:
        return 'text-x-preview';
    }
  }

  private defaultThumbnailsPath(name: string): string {
    const folder =
      process.env.NODE_ENV === 'development'
        ? path.join(__dirname, '../../../../../../assets/thumbnails')
        : path.join(process.resourcesPath, 'assets', 'thumbnails');

    return path.join(folder, `${name}.png`);
  }

  async default(file: File): Promise<void> {
    const mimetype = file.mimeType();
    const icon = this.getIconName(mimetype);

    if (!icon) {
      return;
    }

    const name = this.obtainName(file);
    const were = path.join(this.systemThumbnailsFolder, 'normal', name);

    const iconPath = this.defaultThumbnailsPath(icon);

    try {
      fs.linkSync(iconPath, were);
      Logger.debug(file.nameWithExtension, 'thumbnail created');
    } catch (err) {
      Logger.error(file.nameWithExtension, err);
    }
  }

  pull(_thumbnail: Thumbnail): Promise<Readable> {
    throw new Error('Method not implemented.');
  }
}
