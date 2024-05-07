import { Axios } from 'axios';
import { Service } from 'diod';
import { Readable } from 'stream';
import { File } from '../../../../virtual-drive/files/domain/File';
import { Thumbnail } from '../../domain/Thumbnail';
import { ThumbnailCollection } from '../../domain/ThumbnailCollection';
import { ThumbnailsRepository } from '../../domain/ThumbnailsRepository';
import { EnvironmentThumbnailDownloader } from './EnvironmentThumbnailDownloader';
import Logger from 'electron-log';

type FileMetaDataResponse = {
  thumbnails: [
    {
      id: number;
      fileId: number;
      type: string;
      size: number;
      bucket_id?: string;
      bucket_file?: string;
      bucketId: string;
      bucketFile: string;
      encryptVersion: string;
      createdAt: string;
      updatedAt: string;
      maxWidth: number;
      maxHeight: number;
    }
  ];
};

@Service()
export class RemoteThumbnailsRepository implements ThumbnailsRepository {
  constructor(
    private readonly axios: Axios,
    private readonly downloader: EnvironmentThumbnailDownloader
  ) {}

  async retrieve(file: File): Promise<ThumbnailCollection | undefined> {
    try {
      const response = await this.axios.get(
        `${process.env.NEW_DRIVE_URL}/drive/folders/${file.folderId}/file`,
        {
          params: { name: file.name, type: file.type },
        }
      );

      if (response.status !== 200) {
        return undefined;
      }

      const data = response.data as FileMetaDataResponse;

      const thumbnails = data.thumbnails.map((raw) =>
        Thumbnail.from({
          id: raw.id,
          contentsId: raw.bucketFile,
          type: raw.type,
          bucket: raw.bucketId,
          updatedAt: new Date(raw.updatedAt),
        })
      );

      return new ThumbnailCollection(file, thumbnails);
    } catch (err) {
      Logger.error(err);
      return undefined;
    }
  }

  pull(thumbnail: Thumbnail): Promise<Readable> {
    if (!thumbnail.contentsId) {
      throw new Error('Thumbnail does not have content id');
    }

    return this.downloader.download(thumbnail.contentsId);
  }

  push(_file: File, _stream: Readable): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
