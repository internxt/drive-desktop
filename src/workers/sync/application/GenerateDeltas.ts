import { FileDeltas, ItemState } from '../domain/Delta';
import { Listing, PartialListing } from '../Listings/domain/Listing';

export function generateDeltas(
  saved: Listing,
  current: PartialListing
): FileDeltas {
  const deltas: FileDeltas = {};

  for (const [name, meta] of Object.entries(current)) {
    const savedEntry = saved[name];
    const itemKind = meta.isFolder ? 'FOLDER' : 'FILE';

    if (!savedEntry) {
      deltas[name] = new ItemState('NEW', itemKind);
    } else if (savedEntry.modtime === meta.modtime) {
      deltas[name] = new ItemState('UNCHANGED', itemKind);
    } else if (savedEntry.modtime < meta.modtime) {
      deltas[name] = new ItemState('NEWER', itemKind);
    } else {
      deltas[name] = new ItemState('OLDER', itemKind);
    }
  }

  for (const [name, meta] of Object.entries(saved)) {
    if (!(name in current)) {
      deltas[name] = new ItemState(
        'DELETED',
        meta.isFolder ? 'FOLDER' : 'FILE'
      );
    }
  }

  return deltas;
}
