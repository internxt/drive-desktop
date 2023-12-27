import Logger from 'electron-log';
import { TypedCallback } from './Callback';
import { DependencyContainer } from '../dependency-injection/DependencyContainer';

type CreateCallback = TypedCallback<never>;

export class CreateFile {
  constructor(private readonly container: DependencyContainer) {}

  async execute(
    path: string,
    _mode: number,
    cb: CreateCallback
  ): Promise<void> {
    Logger.debug(`CREATE ${path}`);

    await this.container.retryContentsUploader.run(path);

    cb(0);
  }
}
