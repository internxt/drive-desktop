import { RemoteItemMetaDataAttributes } from 'workers/sync/Listings/domain/RemoteItemMetaData';
import { RemoteListing } from '../../../Listings/domain/Listing';
import { RemoteItemMetaDataMother } from './RemoteItemMetaDataMother';

type RemoteDescriptiveData = Pick<RemoteItemMetaDataAttributes, 'name' | 'id'>;

export class RemoteListingMother {
  static files(data: Array<RemoteDescriptiveData>): RemoteListing {
    return data.reduce((listing: RemoteListing, item: RemoteDescriptiveData) => {
      listing[item.name] = RemoteItemMetaDataMother.file(item);

      return listing;
    }, {});
  }
}
