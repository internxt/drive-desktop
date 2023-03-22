import { RemoteItemMetaDataAttributes } from 'workers/sync/Listings/domain/RemoteItemMetaData';
import { RemoteListing } from '../../../Listings/domain/Listing';
import { RemotelItemMetaDataMother } from './RemoteItemMetaDataMother';

type RemoteDescriptiveData = Pick<RemoteItemMetaDataAttributes, 'name' | 'id'>;

export class RemoteListingMother {
  static files(data: Array<RemoteDescriptiveData>): RemoteListing {
    return data.reduce((listing: RemoteListing, item: RemoteDescriptiveData) => {
      listing[item.name] = RemotelItemMetaDataMother.file(item);

      return listing;
    }, {});
  }
}
