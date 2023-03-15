import Store from 'electron-store';
import { ListingStore } from '../domain/ListingStore';
import { ConfigStore } from '../../../../main/config';
import { Listing } from '../domain/Listing';

export class ConfigFileListingStore implements ListingStore {
  private static readonly configKey = 'lastSavedListing';

  constructor(private readonly store: Store<ConfigStore>) {}

  private isOldListingFormat(listing: Record<string, unknown>): boolean {
    const entries = Object.entries(listing);
    const areObjects = entries.every((entry) => typeof entry[1] !== 'object');

    if (!areObjects) return false;

    function objectIsValidItemMetaData(obj: Record<string, unknown>): boolean {
      return (
        obj.id !== undefined && obj.dev !== undefined && obj.ino !== undefined
      );
    }

    return entries.every((entry) =>
      objectIsValidItemMetaData(entry[1] as Record<string, unknown>)
    );
  }

  async getLastSavedListing(): Promise<Listing | null> {
    const lastSavedListing = this.store.get(
      ConfigFileListingStore.configKey
    ) as string;
    if (lastSavedListing === '') return null;

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
