import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Action } from '../../domain/Action';
import { ItemKind } from '../../../../../shared/ItemKind';

export class DeleteActionBuilder extends ActionBuilder {
  constructor(
    fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
    mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>,
    fileSystem: FileSystemKind
  ) {
    super(fileSystemData, mirrorFileSystemDate, fileSystem, 'DELETE');
  }

  protected getItemKind(): ItemKind {
    return this.mirror.listing.isFolder ? 'FOLDER' : 'FILE';
  }

  create(path: string): Nullable<Action<ItemKind>> {
    if (!this.mirror.state) {
      return;
    }

    if (this.actual.state.is('DELETED') && this.mirror.state.is('UNCHANGED')) {
      return this.build(path);
    }

    return undefined;
  }
}
