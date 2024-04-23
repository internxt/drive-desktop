import { Container } from 'diod';
import { NotifyFuseCallback } from './FuseCallback';
import { TemporalFileCreator } from '../../../context/offline-drive/TemporalFiles/application/creation/TemporalFileCreator';

export class CreateCallback extends NotifyFuseCallback {
  constructor(private readonly container: Container) {
    super('Create');
  }

  async execute(path: string, _mode: number) {
    await this.container.get(TemporalFileCreator).run(path);

    return this.right();
  }
}
