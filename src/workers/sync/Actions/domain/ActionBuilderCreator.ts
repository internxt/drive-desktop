import { ItemKind } from '../../../../shared/ItemKind';
import { Nullable } from '../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../types';
import { ItemState } from '../../ItemState/domain/ItemState';
import { LocalItemMetaData } from '../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../Listings/domain/RemoteItemMetaData';
import { Action, SyncTask } from './Action';

export type Data<T extends LocalItemMetaData | RemoteItemMetaData> = {
  state: ItemState;
  listing: T;
};

export abstract class ActionBuilder {
  constructor(
    protected readonly actual: Data<LocalItemMetaData | RemoteItemMetaData>,
    protected readonly mirror: Data<LocalItemMetaData | RemoteItemMetaData>,
    private readonly fileSystem: FileSystemKind,
    private readonly task: SyncTask
  ) {}

  abstract create(path: string): Nullable<Action<ItemKind>>;

  protected abstract getItemKind(): ItemKind;

  protected canCompareWithMirror(): boolean {
    return this.mirror.state !== undefined && this.mirror.listing !== undefined;
  }

  protected build(path: string): Action<ItemKind> {
    return {
      kind: this.getItemKind(),
      fileSystem: this.fileSystem,
      task: this.task,
      name: path,
    };
  }
}
