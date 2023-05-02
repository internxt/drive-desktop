import { ItemKind } from '../../../../../shared/ItemKind';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Action } from '../../domain/Action';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';
import { ItemCreated } from './StateComparators/ItemCreated';
import { ItemOutdated } from './StateComparators/ItemOutdated';
import { NewerItem } from './StateComparators/NewerItem';
import { StateComparator } from './StateComparators/StateComparator';

export class PullActionBuilder extends ActionBuilder {
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

	protected getItemKind(): ItemKind {
		return this.actual.listing.isFolder ? 'FOLDER' : 'FILE';
	}

	create(path: string): Nullable<Action<ItemKind>> {
		for (const comparator of this.comparators) {
			if (this.actual.listing && comparator.compare(this.mirror.state)) {
				return this.build(path);
			}
		}

		return undefined;
	}
}
