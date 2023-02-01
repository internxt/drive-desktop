import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { ItemCreated } from './StateComparators/ItemCreated';
import { ItemOutdated } from './StateComparators/ItemOutdated';
import { NewerItem } from './StateComparators/NewerItem';
import { StateComparator } from './StateComparators/StateComparator';
import { Action } from '../../domain/Action';

export class PullActionBuilderCreator extends ActionBuilder {
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

  create(path: string): Nullable<Action> {
    for (const comparator of this.comparators) {
      if (comparator.compare(this.mirror.state)) {
        return this.build(path);
      }
    }

    return undefined;
  }
}
