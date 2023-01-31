import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder } from '../../domain/ActionBuilder';
import { ActionBuilderCreator, Data } from '../../domain/ActionBuilderCreator';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';

export class DeleteActionBuilderCreator extends ActionBuilderCreator {
  constructor(
    fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
    mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>,
    fileSystem: FileSystemKind
  ) {
    super(fileSystemData, mirrorFileSystemDate, fileSystem, 'DELETE');
  }

  create(): Nullable<ActionBuilder> {
    if (!this.canCompareWithMirror()) {
      return;
    }

    if (this.actual.state.is('DELETED') && this.mirror.state.is('UNCHANGED')) {
      return this.createActionBuilder();
    }

    return undefined;
  }
}
