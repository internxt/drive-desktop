import { LocalItemMetaData } from '../../Listings/domain/LocalItemMetaData';
import { Listing, PartialListing } from '../../Listings/domain/Listing';
import { ItemDeltas } from '../domain/ItemDelta';
import { ItemState } from '../domain/ItemState';
import { RemoteItemMetaData } from '../../Listings/domain/RemoteItemMetaData';
import { SynchronizedItemMetaData } from 'workers/sync/Listings/domain/SynchronizedItemMetaData';

export function generateDeltas(
  saved: Listing,
  current: PartialListing
): ItemDeltas {
  const deltas: ItemDeltas = {};
  const savedMetaData = Object.values(saved);

  const searchSavedItem = (meta: LocalItemMetaData | RemoteItemMetaData) =>
    savedMetaData.find((data: SynchronizedItemMetaData) => {
      if ('ino' in meta && 'dev' in meta) {
        return data.isLocal(meta);
      }

      if ('id' in meta) {
        return data.isRemote(meta);
      }

      return false;
    });

  const searchCurrentItem = (meta: SynchronizedItemMetaData) =>
    Object.values(current).find(
      (data: LocalItemMetaData | RemoteItemMetaData) => {
        if ('ino' in data && 'dev' in data) {
          return meta.isLocal(data);
        }

        if ('id' in meta) {
          return meta.isRemote(data);
        }

        return false;
      }
    );

  for (const [name, meta] of Object.entries(current)) {
    const savedEntry = saved[name];

    if (!savedEntry) {
      const oldEntry = searchSavedItem(meta);

      if (oldEntry) {
        if (oldEntry.haveSameBaseName(name)) {
          deltas[name] = new ItemState('UNCHANGED');
        } else {
          deltas[name] = new ItemState('RENAME_RESULT', {
            name: oldEntry.name,
            delta: 'RENAMED',
          });
        }
      } else {
        deltas[name] = new ItemState('NEW');
      }
    } else if (savedEntry.modtime === meta.modtime) {
      deltas[name] = new ItemState('UNCHANGED');
    } else if (savedEntry.modtime < meta.modtime) {
      deltas[name] = new ItemState('NEWER');
    } else {
      deltas[name] = new ItemState('OLDER');
    }
  }

  for (const [name, meta] of Object.entries(saved)) {
    if (!(name in current)) {
      const oldEntry = searchCurrentItem(meta);
      if (oldEntry) {
        if (oldEntry.haveSameBaseName(name)) {
          deltas[name] = new ItemState('UNCHANGED');
        } else {
          deltas[name] = new ItemState('RENAMED', {
            name: oldEntry.name,
            delta: 'RENAME_RESULT',
          });
        }
      } else {
        deltas[name] = new ItemState('DELETED');
      }
    }
  }

  return deltas;
}
