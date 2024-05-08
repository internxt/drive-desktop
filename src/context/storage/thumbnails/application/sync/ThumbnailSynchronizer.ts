import { Service } from 'diod';
import { File } from '../../../../virtual-drive/files/domain/File';
import { ThumbnailsRepository } from '../../domain/ThumbnailsRepository';
import { ThumbnailCollection } from '../../domain/ThumbnailCollection';

@Service()
export class ThumbnailSynchronizer {
  constructor(
    private readonly remote: ThumbnailsRepository,
    private readonly local: ThumbnailsRepository
  ) {}

  private async sync(
    remoteCollections: Array<ThumbnailCollection>,
    localCollections: Array<ThumbnailCollection>
  ) {
    const collectionToUpdate = remoteCollections.filter((remoteCollection) => {
      const localCollection = localCollections.find(
        (remoteCollection: ThumbnailCollection) => {
          return remoteCollection.file === remoteCollection.file;
        }
      );

      if (!localCollection) {
        return true;
      }

      const latestLocal = localCollection.getLatestThumbnail();

      const latestRemote = remoteCollection.getLatestThumbnail();

      return latestRemote.isNewer(latestLocal);
    });

    const thumbnailsSyncPromise = collectionToUpdate.map(
      async (remoteCollection) => {
        const thumbnail = remoteCollection.getLatestThumbnail();

        const stream = await this.remote.pull(thumbnail);
        await this.local.push(remoteCollection.file, stream);
      }
    );

    await Promise.all(thumbnailsSyncPromise);
  }

  async run(files: Array<File>): Promise<void> {
    const grouped = files.reduce(
      (accumulator, file) => {
        if (file.isThumbnable()) {
          accumulator.thumbnable.push(file);
        } else {
          accumulator.noThumbnable.push(file);
        }

        return accumulator;
      },
      {
        thumbnable: [] as Array<File>,
        noThumbnable: [] as Array<File>,
      }
    );

    const remoteThumbnailsPromises = grouped.thumbnable.map((file) => {
      return this.remote.retrieve(file);
    });

    const localThumbnailsPromises = files.map((file) =>
      this.local.retrieve(file)
    );

    const remoteCollections = (
      await Promise.all(remoteThumbnailsPromises)
    ).filter((c) => c !== undefined) as Array<ThumbnailCollection>;

    const localCollections = (
      await Promise.all(localThumbnailsPromises)
    ).filter((c) => c !== undefined) as Array<ThumbnailCollection>;

    await this.sync(remoteCollections, localCollections);

    const defaultPromises = grouped.noThumbnable.map(async (file) => {
      const alreadyExists = await this.local.has(file);

      if (alreadyExists) return;

      return this.local.default(file);
    });

    await Promise.all(defaultPromises);
  }
}
