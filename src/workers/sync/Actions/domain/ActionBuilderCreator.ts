import { ItemState } from '../../ItemState/domain/ItemState';
import { FileSystemKind } from '../../../types';
import { Action, SyncTask } from './Action';
import { Nullable } from '../../../../shared/types/Nullable';
import { RemoteItemMetaData } from '../../Listings/domain/RemoteItemMetaData';
import { LocalItemMetaData } from '../../Listings/domain/LocalItemMetaData';

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

  abstract create(path: string): Nullable<Action>;

  protected canCompareWithMirror(): boolean {
    return this.mirror.state !== undefined && this.mirror.listing !== undefined;
  }

  protected build(path: string): Action {
    return {
      fileSystem: this.fileSystem,
      task: this.task,
      name: path,
    };
  }
}
