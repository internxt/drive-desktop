import { LocalItemMetaDataAttributes } from '../../../Listings/domain/LocalItemMetaData';
import { LocalListing } from '../../../Listings/domain/Listing';
import { LocalItemMetaDataMother } from './LocalItemMetaDataMother';

type LocalDescriptiveData = Pick<LocalItemMetaDataAttributes, 'name' | 'dev' |'ino'>;

export class LocalListingMother {

  static files(data: Array<LocalDescriptiveData>): LocalListing {

    return data.reduce((listing: LocalListing, item: LocalDescriptiveData) => {
      listing[item.name] = LocalItemMetaDataMother.file(item);

      return listing;
    }, {});

  }
}
