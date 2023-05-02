import { LocalListing, RemoteListing } from '../domain/Listing';

export function listingsAreInSync(local: LocalListing, remote: RemoteListing): boolean {
	return Object.entries(local).every(([name, localListing]) => {
		const remoteListing = remote[name];

		if (!remoteListing) {
			return false;
		}

		if (localListing.isFolder) {
			return true;
		}

		return (
			localListing.isFolder === remoteListing.isFolder &&
			localListing.size == remoteListing.size &&
			localListing.modtime === remoteListing.modtime
		);
	});
}
