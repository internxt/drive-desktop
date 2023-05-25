import { LocalItemMetaData } from '../domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../domain/RemoteItemMetaData';
import {
	SynchronizedItemMetaData,
	SynchronizeMetaDataAttributes,
} from '../domain/SynchronizedItemMetaData';

export function createSynchronizedItemMetaDataFromPartials(
	local: LocalItemMetaData,
	remote: RemoteItemMetaData
): SynchronizedItemMetaData {
	const attributes: SynchronizeMetaDataAttributes = {
		...local.toJSON(),
		...remote.toJSON(),
	};

	return SynchronizedItemMetaData.from(attributes);
}
