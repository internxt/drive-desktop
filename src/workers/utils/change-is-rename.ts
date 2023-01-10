import _ from 'lodash';
import Logger from 'electron-log';
import { Delta, Deltas, Status } from '../sync/Deltas';
import { Listing, ListingData, LocalListing, LocalListingData } from '../types';
import { Tuple } from './types';

export type OldName = string;
export type NewName = string;

export type RenameChanges =
  | {
      isRename: false;
    }
  | {
      isRename: true;
      changes: [OldName, NewName];
    };

function cannotCheck(...listings: Array<LocalListing>): boolean {
  return listings.every((listing) => {
    const listingsData = Object.values(listing);

    return listingsData.every(
      (data) => !data.dev || !data.ino || data.size === 0
    );
  });
}

function checkSingleItemRename(
  [newName, created]: Tuple<NewName, LocalListingData>,
  [oldName, deleted]: Tuple<OldName, LocalListingData>
): Deltas {
  if (created.size !== parseInt(deleted.size as unknown as string, 10)) {
    return {};
  }

  if (created.dev !== deleted.dev) {
    return {};
  }

  if (created.ino !== deleted.ino) {
    return {};
  }

  if (created.isFolder !== deleted.isFolder) {
    return {};
  }

  return {
    [newName]: new Delta('NEW_NAME', created.isFolder),
    [oldName]: new Delta('RENAMED', deleted.isFolder),
  };
}

function findRootPath(changes: Array<string>): string | null {
  const potentialFolder = changes.reduce(
    (currentShortes: string, currentValue: string) =>
      currentValue.length < currentShortes.length
        ? currentValue
        : currentShortes
  );

  const thereIsRootPath = changes.every(
    (filePaht) =>
      filePaht !== potentialFolder || filePaht.includes(potentialFolder)
  );

  return thereIsRootPath ? potentialFolder : null;
}

function checkFolderRename(created: Listing, deleted: Listing): Deltas {
  const createRootPath = findRootPath(Object.keys(created));
  const deletedRootPath = findRootPath(Object.keys(deleted));

  if (!createRootPath || !deletedRootPath) {
    return {};
  }

  return checkSingleItemRename(
    [createRootPath, created[createRootPath]],
    [deletedRootPath, deleted[deletedRootPath]]
  );
}

type DeltasByType = {
  [D in Status]: string[];
};

function index(deltas: Deltas): DeltasByType {
  return Object.keys(deltas).reduce(
    (obj: DeltasByType, name: string) => {
      obj[deltas[name].status].push(name);

      return obj;
    },
    {
      NEW: [],
      NEWER: [],
      DELETED: [],
      OLDER: [],
      UNCHANGED: [],
      NEW_NAME: [],
      RENAMED: [],
    }
  );
}

function thereAreNewerDeltasAndTheyAreFiles(deltas: Deltas): boolean {
  // When a file gets renamed inside a folder the last update of that folders gets updated
  // making it appera as newer
  return (
    Object.values(deltas).filter(
      (delta: Delta) => delta.is('NEWER') && delta.itemKind === 'FILE'
    ).length > 0
  );
}

export function generateRenameDeltas(
  deltas: Deltas,
  old: LocalListing,
  current: LocalListing
): Deltas {
  if (cannotCheck(old, current)) {
    Logger.warn('Cannot check for renames');
    return {};
  }

  const deltasByType = index(deltas);

  if (thereAreNewerDeltasAndTheyAreFiles(deltas)) return {};

  if (
    (['OLDER', 'NEW_NAME', 'RENAMED'] as Status[]).some(
      (delta) => deltasByType[delta].length !== 0
    )
  )
    return {};

  if (deltasByType.NEW.length !== deltasByType.DELETED.length) return {};

  if (deltasByType.NEW.length === 0) return {};

  const created = deltasByType.NEW;
  const deleted = deltasByType.DELETED;

  if (created.length === 1) {
    return checkSingleItemRename(
      [created[0], current[created[0]]],
      [deleted[0], old[deleted[0]]]
    );
  }

  const createdListing = created.reduce((acc: LocalListing, name: string) => {
    acc[name] = current[name];
    return acc;
  }, {});

  const deletedListing = deleted.reduce((acc: LocalListing, name: string) => {
    acc[name] = old[name];
    return acc;
  }, {});

  return checkFolderRename(createdListing, deletedListing);
}

export function listingsAreEqual(
  local: LocalListing,
  remote: Listing
): boolean {
  const l: Listing = Object.keys(local).reduce(
    (listing: Listing, key: string) => {
      const { size, modtime, isFolder } = local[key];

      listing[key] = {
        size: size.toString(),
        modtime,
        isFolder,
      } as unknown as ListingData;

      return listing;
    },
    {}
  );

  return _.isEqual(l, remote);
}
