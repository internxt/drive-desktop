import { ItemKind } from '../../../../../shared/ItemKind';
import { Nullable } from '../../../../../shared/types/Nullable';
import { FileSystemKind } from '../../../../types';
import { Delta } from '../../../ItemState/domain/Delta';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { Action } from '../../domain/Action';
import { ActionBuilder, Data } from '../../domain/ActionBuilderCreator';

function mostRecentFileSystem(
	fileSystemData: Data<LocalItemMetaData | RemoteItemMetaData>,
	mirrorFileSystemDate: Data<LocalItemMetaData | RemoteItemMetaData>
): FileSystemKind {
	return fileSystemData.listing?.modtime < mirrorFileSystemDate.listing?.modtime
		? 'LOCAL'
		: 'REMOTE';
}

export class KeepMostRecentActionBuilder extends ActionBuilder {
	constructor(local: Data<LocalItemMetaData>, remote: Data<RemoteItemMetaData>) {
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

		if (this.actual.listing === undefined) {
			console.log(JSON.stringify(this.actual.listing));
		}

		if (
			this.actual.listing !== undefined &&
			this.actual?.listing.isFolder &&
			this.mirror?.listing.isFolder
		) {
			// Remote FS cannot update the modification time
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
