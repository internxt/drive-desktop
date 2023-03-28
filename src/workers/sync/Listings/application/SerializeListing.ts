import { Listing, SerializedListing } from '../domain/Listing';

export function serializeListing(listing: Listing | null): SerializedListing {
  if (!listing) return {};

  return Object.values(listing).reduce((listing, current) => {
    listing[current.name] = current.toJson();

    return listing;
  }, {} as SerializedListing);
}
