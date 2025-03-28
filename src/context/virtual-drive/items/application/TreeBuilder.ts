import { ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { Tree } from '../domain/Tree';
import { RemoteItemsGenerator } from './RemoteItemsGenerator';
import { Traverser } from './Traverser';

export class TreeBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser,
  ) {}

  public setFileStatusesToFilter(statuses: Array<ServerFileStatus>): void {
    this.traverser.setFileStatusesToFilter(statuses);
  }

  public setFolderStatusesToFilter(statuses: Array<ServerFolderStatus>): void {
    this.traverser.setFolderStatusesToFilter(statuses);
  }

  async run(): Promise<Tree> {
    const items = await this.remoteItemsGenerator.getAll();

    return this.traverser.run(items);
  }
}
