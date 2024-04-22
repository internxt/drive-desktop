import { Service } from 'diod';
import { LocalFileSystem } from '../domain/LocalFileSystem';
import Logger from 'electron-log';

@Service()
export class AllLocalContentsDeleter {
  constructor(private readonly localFileSystem: LocalFileSystem) {}

  async run(): Promise<void> {
    const contentsIds = await this.localFileSystem.listExistentFiles();

    const deletion = contentsIds.map((contentsId) =>
      this.localFileSystem.remove(contentsId)
    );

    const result = await Promise.allSettled(deletion);

    const fulfilled = result.filter(({ status }) => status === 'fulfilled');

    Logger.info(
      `Deleted ${fulfilled.length} of ${contentsIds.length} file contents from local cache`
    );
  }
}
