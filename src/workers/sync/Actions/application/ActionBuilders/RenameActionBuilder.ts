import { Nullable } from 'shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Action } from '../../domain/Action';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { ItemKind } from '../../../../../shared/ItemKind';

function mostRecentFileSystem(
  fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
  mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>
): FileSystemKind {
  return fileSystemData.listing?.modtime < mirrorFileSystemDate.listing?.modtime
    ? 'LOCAL'
    : 'REMOTE';
}

export class RenameActionBuilder extends ActionBuilder {
  constructor(
    local: Data<LocalItemMetaData>,
    remote: Data<RemoteItemMetaData>
  ) {
    const where = mostRecentFileSystem(local, remote);
    super(local, remote, where, 'RENAME');
  }

  create(path: string): Nullable<Action<ItemKind>> {
    if (
      this.actual.state.is('RENAME_RESULT') &&
      this.mirror.listing === undefined
    ) {
      return this.build(path);
    }

    return undefined;
  }

  protected getItemKind(): ItemKind {
    return this.actual.listing.isFolder ? 'FOLDER' : 'FILE';
  }
}
