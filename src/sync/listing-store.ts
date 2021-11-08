import { Listing, ListingStore } from './sync'
import SyncDB from './sync-db'

export default function getListingStore(
  localPath: string,
  folderId: number
): ListingStore {

  return {
    async getLastSavedListing(): Promise<Listing | null> {
      const res = await SyncDB.getOne({localPath, folderId})
      return res.length === 1 ? JSON.parse(res[0].listing) : null
    },

    async saveListing(listing: Listing): Promise<void> {
      await SyncDB.saveListing({localPath, folderId, listing: JSON.stringify(listing)})
    },

    async removeSavedListing(): Promise<void> {
      await SyncDB.removeListing({localPath, folderId})
    }
  }
}
