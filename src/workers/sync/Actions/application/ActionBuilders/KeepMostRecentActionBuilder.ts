import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Delta } from '../../../ItemState/domain/Delta';
import { Action } from '../../domain/Action';
import { ItemKind } from '../../../../../shared/ItemKind';

function mostRecentFileSystem(
  fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
  mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>
): FileSystemKind {
  return fileSystemData.listing?.modtime < mirrorFileSystemDate.listing?.modtime
    ? 'LOCAL'
    : 'REMOTE';
}

export class KeepMostRecentActionBuilder extends ActionBuilder {
  constructor(
    local: Data<LocalItemMetaData>,
    remote: Data<RemoteItemMetaData>
  ) {
    const where = mostRecentFileSystem(local, remote);
    super(local, remote, where, 'PULL');
  }

  private haveDeferentModTime(): boolean {
    return this.actual.listing.modtime !== this.mirror.listing.modtime;
  }

  protected getItemKind(): ItemKind {
    return this.actual.listing.isFolder ? 'FOLDER' : 'FILE';
  }

  create(path: string): Nullable<Action<ItemKind>> {
    if (!this.canCompareWithMirror()) {
      return;
    }

    const posibleDeltas: Array<Delta> = ['NEW', 'NEWER', 'OLDER'];

    for (const delta of posibleDeltas) {
      if (
        this.actual.state.is(delta) &&
        this.mirror.state.is(delta) &&
        this.haveDeferentModTime()
      ) {
        return this.build(path);
      }
    }

    return undefined;
  }
}
