import Store from 'electron-store';

import { AppStore } from '../../../../main/config';
import { Listing } from '../domain/Listing';
import { ListingStore } from '../domain/ListingStore';

export class ConfigFileListingStore implements ListingStore {
  private static readonly configKey = 'lastSavedListing';

  constructor(private readonly store: Store<AppStore>) {}

  private isOldListingFormat(listing: Record<string, unknown>): boolean {
    const entries = Object.entries(listing);

    function objectHasValidItemMetaData(obj: unknown): boolean {
      return (
        obj !== null &&
        typeof obj === 'object' &&
        'id' in obj &&
        'dev' in obj &&
        'ino' in obj &&
        'isFolder' in obj
      );
    }

    return entries.every((entry) => !objectHasValidItemMetaData(entry[1]));
  }

  async getLastSavedListing(): Promise<Listing | null> {
    const lastSavedListing = this.store.get(
      ConfigFileListingStore.configKey
    ) as string;
    if (lastSavedListing === '') {
      return null;
    }

    const listingParsed = JSON.parse(lastSavedListing);

    if (this.isOldListingFormat(listingParsed)) {
      return null;
    }

    return listingParsed;
  }

  async removeSavedListing(): Promise<void> {
    this.store.set(ConfigFileListingStore.configKey, '');
  }

  async saveListing(listing: Listing): Promise<void> {
    this.store.set(ConfigFileListingStore.configKey, JSON.stringify(listing));
  }
}
