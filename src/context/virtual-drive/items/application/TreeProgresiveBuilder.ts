import { ServerFileStatus } from '../../../shared/domain/ServerFile';
import { ServerFolderStatus } from '../../../shared/domain/ServerFolder';
import { Tree } from '../domain/Tree';
import { RemoteItemsGenerator } from './RemoteItemsGenerator';
import { Traverser } from './Traverser';

export class TreeProgresiveBuilder {
  constructor(
    private readonly remoteItemsGenerator: RemoteItemsGenerator,
    private readonly traverser: Traverser
  ) {}

  public setFilterStatusesToFilter(statuses: Array<ServerFileStatus>): void {
    this.traverser.setFileStatusesToFilter(statuses);
  }

  public setFolderStatusesToFilter(statuses: Array<ServerFolderStatus>): void {
    this.traverser.setFolderStatusesToFilter(statuses);
  }
  // hacer un recorrido progresivo empezar por el root y luego ir a los folders hijos y ejecutar el traverser

  async run(): Promise<Tree> {
    // obtener los items del root

    // ejecutar el traverser

    // ejecutar el recursiveTraverse para cada folder hijo
    const items = await this.remoteItemsGenerator.getAll();

    return this.traverser.run(items);
  }
}
