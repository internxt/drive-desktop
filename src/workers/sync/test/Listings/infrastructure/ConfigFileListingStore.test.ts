import Store from 'electron-store';
import { ConfigFileListingStore } from '../../../Listings/infrastructure/ConfigFileListingStore';
import { ConfigStore } from '../../../../../main/config';
import { Listing } from '../../../../../workers/sync/Listings/domain/Listing';

describe('Config File Listing Store', () => {
  describe('obtain saved listings', () => {
    it('returns null when the last saved listing does not meet the new data required', async () => {
      const oldListing = {
        ttTSJ: { modtime: 1654979471, size: '56689' },
        bKBhB: { modtime: 1666728627, size: '26862' },
        EbcAi: { modtime: 1598816064, size: '795' },
        EMxcl: { modtime: 1655326564, size: '2297' },
      };

      const electronStore = {
        get: jest.fn().mockImplementation(() => {
          return JSON.stringify(oldListing);
        }),
      } as unknown as Store<ConfigStore>;

      const store = new ConfigFileListingStore(electronStore);

      const listing = await store.getLastSavedListing();

      expect(listing).toBe(null);
    });

    it('returns the listing when the last saved listing have the current info in it', async () => {
      const newListing = {
        bKBhB: {
          modtime: 1680101575,
          size: 9,
          isFolder: false,
          id: 346170843,
          ino: 13684721,
          dev: 64770,
        },
      };

      const electronStore = {
        get: jest.fn().mockImplementation(() => {
          return JSON.stringify(newListing);
        }),
      } as unknown as Store<ConfigStore>;

      const store = new ConfigFileListingStore(electronStore);

      const listing = await store.getLastSavedListing();

      expect(listing).not.toBe(null);
      expect(Object.keys(listing as Listing)).toHaveLength(1);

      const synchronnizedMetadata = Object.values(listing as Listing)[0];

      expect(synchronnizedMetadata).toHaveProperty('id');
      expect(synchronnizedMetadata).toHaveProperty('dev');
      expect(synchronnizedMetadata).toHaveProperty('ino');
      expect(synchronnizedMetadata).toHaveProperty('isFolder');
    });
  });
});
