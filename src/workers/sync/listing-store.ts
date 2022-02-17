import ConfigStore from '../../main/config';
import { Listing } from '../types';
import { ListingStore } from './sync';

export default function getListingStore(): ListingStore {
  function isOldListingFormat(listing: Record<string, any>): boolean {
    const entries = Object.entries(listing);
    return entries.some((entry) => typeof entry[1] !== 'object');
  }

  function convertOldListingFormat(listing: Record<string, number>): Listing {
    const listingConverted: Listing = {};
    for (const [name, modtime] of Object.entries(listing)) {
      listingConverted[name] = { modtime, size: 0 };
    }

    return listingConverted;
  }
  return {
    async getLastSavedListing(): Promise<Listing | null> {
      const lastSavedListing = ConfigStore.get('lastSavedListing') as string;
      if (lastSavedListing === '') return null;

      const listingParsed = JSON.parse(lastSavedListing);

      if (isOldListingFormat(listingParsed))
        return convertOldListingFormat(listingParsed);
      else return listingParsed;
    },

    async saveListing(listing: Listing): Promise<void> {
      ConfigStore.set('lastSavedListing', JSON.stringify(listing));
    },

    async removeSavedListing(): Promise<void> {
      ConfigStore.set('lastSavedListing', '');
    },
  };
}
