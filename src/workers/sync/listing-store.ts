import ConfigStore from '../../main/config';
import { FileName, Listing, LocalListing } from '../types';
import { ListingStore } from './sync';

type OriginalListingData = number;

type ListingDataWithSize = {
  modtime: number;
  size: number;
};

type OldListing<T> = Record<FileName, T>;

export default function getListingStore(): ListingStore {
  function isOriginalListingFormat(
    listing: Record<string, unknown>
  ): listing is OldListing<OriginalListingData> {
    const entries = Object.entries(listing);
    return entries.some((entry) => typeof entry[1] !== 'object');
  }

  function convertOriginalListingFormat(
    listing: OldListing<OriginalListingData>
  ): OldListing<ListingDataWithSize> {
    const listingConverted: OldListing<ListingDataWithSize> = {};

    for (const [name, modtime] of Object.entries(listing)) {
      listingConverted[name] = { modtime, size: 0 };
    }

    return listingConverted;
  }

  function convertListingWithSize(
    listing: OldListing<ListingDataWithSize>
  ): LocalListing {
    const listingConverted: LocalListing = {};

    for (const [name, data] of Object.entries(listing)) {
      listingConverted[name] = {
        ...data,
        isFolder: false, // isFolder can be set since before all items were files
        ino: undefined,
        dev: undefined,
      };
    }

    return listingConverted;
  }

  return {
    async getLastSavedListing(): Promise<LocalListing | null> {
      const lastSavedListing = ConfigStore.get('lastSavedListing') as string;
      if (lastSavedListing === '') return null;

      const listingParsed = JSON.parse(lastSavedListing);

      if (isOriginalListingFormat(listingParsed)) {
        const old = convertOriginalListingFormat(listingParsed);
        return convertListingWithSize(old);
      } else return listingParsed;
    },

    async saveListing(listing: Listing | LocalListing): Promise<void> {
      ConfigStore.set('lastSavedListing', JSON.stringify(listing));
    },

    async removeSavedListing(): Promise<void> {
      ConfigStore.set('lastSavedListing', '');
    },
  };
}
