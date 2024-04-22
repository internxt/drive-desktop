import { Container } from 'diod';
import { OfflineFileAndContentsCreator } from '../../../context/offline-drive/boundaryBridge/application/OfflineFileAndContentsCreator';
import { NotifyFuseCallback } from './FuseCallback';

export class CreateCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Create');
  }

  async execute(path: string, _mode: number) {
    await this.container.get(OfflineFileAndContentsCreator).run(path);

    return this.right();
  }
}
