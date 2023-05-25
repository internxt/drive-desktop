import { ItemMetaData, ItemMetaDataAttributes } from './ItemMeataData';

export type RemoteItemMetaDataAttributes = ItemMetaDataAttributes & {
	id: number;
};

export class RemoteItemMetaData extends ItemMetaData {
	constructor(
		public readonly modtime: number,
		public readonly size: number,
		public readonly isFolder: boolean,
		private readonly id: number
	) {
		super(modtime, size, isFolder);
	}

	same(other: RemoteItemMetaData) {
		return this.id === other.id;
	}

	static from(attributes: RemoteItemMetaDataAttributes): RemoteItemMetaData {
		return new RemoteItemMetaData(
			attributes.modtime,
			attributes.size,
			attributes.isFolder,
			attributes.id
		);
	}

	toJSON(): RemoteItemMetaDataAttributes {
		return {
			modtime: this.modtime,
			size: this.size,
			isFolder: this.isFolder,
			id: this.id,
		};
	}
}
