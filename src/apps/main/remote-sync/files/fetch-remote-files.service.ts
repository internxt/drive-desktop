import { FETCH_LIMIT } from '../store';
import { FetchFilesService, FetchFilesServiceParams } from './fetch-files.service.interface';
import { driveServerWipModule } from '@/infra/drive-server-wip/drive-server-wip.module';

export class FetchRemoteFilesService implements FetchFilesService {
  constructor(private readonly driveServerWip = driveServerWipModule) {}

  async run({ updatedAtCheckpoint, offset, status, folderUuid }: FetchFilesServiceParams) {
    const promise = folderUuid
      ? this.driveServerWip.folders.getFiles({
          folderUuid,
          query: {
            limit: FETCH_LIMIT,
            offset,
            sort: 'updatedAt',
            order: 'DESC',
          },
        })
      : this.driveServerWip.files.getFiles({
          query: {
            limit: FETCH_LIMIT,
            offset,
            status,
            updatedAt: updatedAtCheckpoint?.toISOString(),
          },
        });

    const { data, error } = await promise;

    if (error) throw error;

    const hasMore = data.length === FETCH_LIMIT;
    return {
      hasMore,
      result: data.map((file) => ({
        ...file,
        /**
         * v2.5.2 Daniel Jiménez
         * In drive-server-wip they are working with bigint and fetch converts it to string.
         * We need to convert it to a number.
         */
        size: Number(file.size),
      })),
    };
  }
}
