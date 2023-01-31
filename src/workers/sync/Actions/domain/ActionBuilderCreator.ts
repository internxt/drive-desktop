import { ItemState } from '../../ItemState/domain/ItemState';
import { FileSystemKind } from '../../../types';
import { SyncTask } from './Action';
import { Nullable } from '../../../../shared/types/Nullable';
import { ActionBuilder } from './ActionBuilder';
import { RemoteItemMetaData } from '../../Listings/domain/RemoteItemMetaData';
import { LocalItemMetaData } from '../../Listings/domain/LocalItemMetaData';

export type Data<T extends LocalItemMetaData | RemoteItemMetaData> = {
  state: ItemState;
  listing: T;
};

export abstract class ActionBuilderCreator {
  constructor(
    protected readonly actual: Data<LocalItemMetaData | RemoteItemMetaData>,
    protected readonly mirror: Data<LocalItemMetaData | RemoteItemMetaData>,
    private readonly fileSystem: FileSystemKind,
    private readonly task: SyncTask
  ) {}

  abstract create(): Nullable<ActionBuilder>;

  protected canCompareWithMirror(): boolean {
    return this.mirror.state !== undefined && this.mirror.listing !== undefined;
  }

  protected createActionBuilder(): ActionBuilder {
    return (name: string) => ({
      fileSystem: this.fileSystem,
      task: this.task,
      name,
    });
  }
}
