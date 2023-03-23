import { Nullable } from 'shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Action } from '../../domain/Action';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { ItemKind } from '../../../../../shared/ItemKind';

export class RenameActionBuilder extends ActionBuilder {
  constructor(
    local: Data<LocalItemMetaData | RemoteItemMetaData>,
    remote: Data<LocalItemMetaData | RemoteItemMetaData>,
    fileSystem: FileSystemKind
  ) {
    super(local, remote, fileSystem, 'RENAME');
  }

  create(path: string): Nullable<Action<ItemKind>> {
    if (
      this.actual.state.is('RENAME_RESULT') &&
      this.actual.state.hasAssociateStateWithDelta('RENAMED') &&
      this.mirror.listing === undefined
    ) {
      return this.build(path);
    }

    return undefined;
  }

  protected build(path: string): Action<ItemKind> {
    return {
      kind: this.getItemKind(),
      fileSystem: this.fileSystem,
      task: this.task,
      name: path,
      ref: this.actual.state.associateItemName() as string,
    };
  }

  protected getItemKind(): ItemKind {
    return this.actual.listing.isFolder ? 'FOLDER' : 'FILE';
  }
}
