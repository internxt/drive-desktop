import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder } from '../../domain/ActionBuilder';
import { ActionBuilderCreator, Data } from '../../domain/ActionBuilderCreator';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Delta } from '../../../ItemState/domain/Delta';

function mostRecentFileSystem(
  fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
  mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>
): FileSystemKind {
  return fileSystemData.listing?.modtime < mirrorFileSystemDate.listing?.modtime
    ? 'LOCAL'
    : 'REMOTE';
}

export class KeepMostRecentActionBuilderCreator extends ActionBuilderCreator {
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

  create(): Nullable<ActionBuilder> {
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
        return this.createActionBuilder();
      }
    }

    return undefined;
  }
}
