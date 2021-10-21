import { Listing, ListingStore } from "./sync";

export default function getListingStore(localPath: string, remoteFolderId: number, configStore: any): ListingStore {
	const key = `local:${localPath}--remote:${remoteFolderId}`

	function getAllListings(): Record<string, Listing>{
		return configStore.get('listings') as Record<string, Listing>
	}

	function saveAllListings(allListings: Record<string, Listing>): void {
		configStore.set('listings', allListings)
	}

	return {
		getLastSavedListing(): Listing | null {
			const allListings = getAllListings()
			const listing = allListings[key]

			return listing ?? null
		},

		saveListing(listing: Listing): void {
			const allListings = getAllListings()
			saveAllListings({...allListings, [key]: listing})
		},

		removeSavedListing(): void {
			const allListings = getAllListings()
			delete allListings[key]
			saveAllListings(allListings)
		},
	}
}