import ConfigStore from '../../main/config';
import { Listing, ListingStore } from './sync';

export default function getListingStore(): ListingStore {
  return {
    async getLastSavedListing(): Promise<Listing | null> {
      const lastSavedListing = ConfigStore.get('lastSavedListing') as string;
      return lastSavedListing !== '' ? JSON.parse(lastSavedListing) : null;
    },

    async saveListing(listing: Listing): Promise<void> {
      ConfigStore.set('lastSavedListing', JSON.stringify(listing));
    },

    async removeSavedListing(): Promise<void> {
      ConfigStore.set('lastSavedListing', '');
    },
  };
}
