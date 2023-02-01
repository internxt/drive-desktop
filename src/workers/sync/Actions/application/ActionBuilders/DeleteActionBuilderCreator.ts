import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Action } from '../../domain/Action';

export class DeleteActionBuilderCreator extends ActionBuilder {
  constructor(
    fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
    mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>,
    fileSystem: FileSystemKind
  ) {
    super(fileSystemData, mirrorFileSystemDate, fileSystem, 'DELETE');
  }

  create(path: string): Nullable<Action> {
    if (!this.canCompareWithMirror()) {
      return;
    }

    if (this.actual.state.is('DELETED') && this.mirror.state.is('UNCHANGED')) {
      return this.build(path);
    }

    return undefined;
  }
}
