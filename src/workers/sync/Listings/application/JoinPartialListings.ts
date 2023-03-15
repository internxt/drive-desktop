import { Listing, LocalListing, RemoteListing } from '../domain/Listing';
import { createSynchronizedItemMetaDataFromPartials } from './JoinPartialMetaData';

export function joinPartialListings(
  local: LocalListing,
  remote: RemoteListing
): Listing {
  const paths = Object.keys(local);

  return paths.reduce((listings: Listing, path: string) => {
    listings[path] = createSynchronizedItemMetaDataFromPartials(
      local[path],
      remote[path]
    );
    return listings;
  }, {});
}
