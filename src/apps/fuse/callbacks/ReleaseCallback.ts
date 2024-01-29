import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { FuseIOError } from './FuseErrors';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super('Release');
  }

  async execute(path: string, fd: number) {
    const file = await this.container.offlineFileSearcher.run({ path });

    if (!file) {
      return this.right();
    }

    try {
      await this.container.offlineContentsUploader.run(file.id, file.path);
      return this.right();
    } catch (err: unknown) {
      if (err instanceof Error) {
        return this.left(
          new FuseIOError(
            `${err.message} when uploading ${path} and with flag: ${fd}`
          )
        );
      }

      return this.left(
        new FuseIOError(`Error when uploading ${path} with flag ${fd}: ${err}`)
      );
    }
  }
}
