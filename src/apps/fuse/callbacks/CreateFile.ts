import Logger from 'electron-log';
import { TypedCallback } from './Callback';
import { OfflineDriveDependencyContainer } from '../dependency-injection/offline/OfflineDriveDependencyContainer';

type CreateCallback = TypedCallback<never>;

export class CreateFile {
  constructor(private readonly container: OfflineDriveDependencyContainer) {}

  async execute(
    path: string,
    _mode: number,
    cb: CreateCallback
  ): Promise<void> {
    Logger.debug(`CREATE ${path}`);

    await this.container.offlineFileAndContentsCreator.run(path);

    cb(0);
  }
}
