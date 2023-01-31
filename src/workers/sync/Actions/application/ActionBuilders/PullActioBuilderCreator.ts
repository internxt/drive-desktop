import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder } from '../../domain/ActionBuilder';
import { ActionBuilderCreator, Data } from '../../domain/ActionBuilderCreator';
import { ItemCreated } from './StateComparators/ItemCreated';
import { ItemOutdated } from './StateComparators/ItemOutdated';
import { NewerItem } from './StateComparators/NewerItem';
import { StateComparator } from './StateComparators/StateComparator';

export class PullActionBuilderCreator extends ActionBuilderCreator {
  private comparators: Array<StateComparator>;

  constructor(
    fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
    mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>,
    fileSystem: FileSystemKind
  ) {
    super(fileSystemData, mirrorFileSystemDate, fileSystem, 'PULL');

    this.comparators = [
      new ItemCreated(fileSystemData.state),
      new NewerItem(fileSystemData.state),
      new ItemOutdated(fileSystemData.state),
    ];
  }

  create(): Nullable<ActionBuilder> {
    for (const comparator of this.comparators) {
      if (comparator.compare(this.mirror.state)) {
        return this.createActionBuilder();
      }
    }

    return undefined;
  }
}
