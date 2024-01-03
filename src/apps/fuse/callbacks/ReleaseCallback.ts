import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';
import { NotifyFuseCallback } from './FuseCallback';
import { IOError } from './FuseErrors';

export class ReleaseCallback extends NotifyFuseCallback {
  constructor(private readonly container: OfflineDriveDependencyContainer) {
    super();
  }

  async execute(path: string, fd: number) {
    const file = await this.container.offlineFileSearcher.run({ path });

    if (!file) {
      return this.right();
    }

    try {
      await this.container.offlineFileUploader.run(file);
      return this.right();
    } catch (err: unknown) {
      if (err instanceof Error) {
        return this.left(
          new IOError(
            `${err.message} when uploading ${path} and with flag: ${fd}`
          )
        );
      }

      return this.left(
        new IOError(`Error when uploading ${path} with flag ${fd}: ${err}`)
      );
    }
  }
}
