import { LocalItemMetaDataAttributes } from '../../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaDataAttributes } from '../../../../Listings/domain/RemoteItemMetaData';

export const fileMetaData = {
	modtime: 0,
	size: 1,
	isFolder: false,
};

export const localFileMetaData: LocalItemMetaDataAttributes = {
	...fileMetaData,
	ino: 1,
	dev: 1,
};

export const remoteFileMetaData: RemoteItemMetaDataAttributes = {
	...fileMetaData,
	id: 2340958,
};
