import Logger from 'electron-log';
import _ from 'lodash';
import { Listing, ListingData, LocalListing, LocalListingData } from '../types';
import { Delta, Deltas } from '../sync/sync';
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

function cannotCheck(created: LocalListingData, deleted: LocalListingData) {
  return (
    !created.dev ||
    !deleted.dev ||
    !created.ino ||
    !deleted.ino ||
    created.size === 0 ||
    deleted.size === 0
  );
}

function checkSingleItemRename(
  [newName, created]: Tuple<NewName, LocalListingData>,
  [oldName, deleted]: Tuple<OldName, LocalListingData>
): Deltas {
  Logger.debug('before check');
  // try {
  //   if (cannotCheck(created, deleted)) return {};
  // } catch (err: any) {
  //   Logger.debug('after check', err);
  // }

  Logger.debug('CREATED', created);
  Logger.debug('DELETED', deleted);

  // if (created.birthtimeMs !== deleted.birthtimeMs) {
  //   return {};
  // }
  Logger.debug('after birthtimeMs');

  if (created.size !== parseInt(deleted.size as unknown as string, 10)) {
    return {};
  }
  Logger.debug('after size');

  if (created.dev !== deleted.dev) {
    return {};
  }

  if (created.ino !== deleted.ino) {
    return {};
  }

  Logger.debug('after isFolder');
  return {
    [newName]: 'NEW_NAME',
    [oldName]: 'RENAMED',
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

  // if (!created[createRootPath].isFolder || !deleted[deletedRootPath].isFolder) {
  //   return {};
  // }

  return checkSingleItemRename(
    [createRootPath, created[createRootPath]],
    [deletedRootPath, deleted[deletedRootPath]]
  );
}

type DeltasByType = {
  [D in Delta]: string[];
};

function index(deltas: Deltas): DeltasByType {
  return Object.keys(deltas).reduce(
    (obj: DeltasByType, name: string) => {
      obj[deltas[name]].push(name);

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

const otherDeltas: Array<Delta> = ['NEWER', 'OLDER', 'NEW_NAME', 'RENAMED'];

export function generateRenameDeltas(
  deltas: Deltas,
  old: LocalListing,
  current: LocalListing
): Deltas {
  Logger.debug('old', old);
  Logger.debug('current', current);
  const deltasByType = index(deltas);

  Logger.debug('deltasByType', deltasByType);

  if (otherDeltas.some((delta) => deltasByType[delta].length !== 0)) return {};

  if (deltasByType.NEW.length !== deltasByType.DELETED.length) return {};

  if (deltasByType.NEW.length === 0) return {};

  const created = deltasByType.NEW;
  const deleted = deltasByType.DELETED;

  if (deltasByType.NEW.length === 1) {
    Logger.debug('single check');
    return checkSingleItemRename(
      [created[0], current[created[0]]],
      [deleted[0], old[deleted[0]]]
    );
  }

  Logger.debug('NO single check');

  const createdListing = created.reduce((acc: LocalListing, name: string) => {
    acc[name] = current[name];
    return acc;
  }, {});

  Logger.debug('createdListing', createdListing);

  const deletedListing = deleted.reduce((acc: LocalListing, name: string) => {
    acc[name] = old[name];
    return acc;
  }, {});

  Logger.debug('deletedListing', deletedListing);

  return checkFolderRename(createdListing, deletedListing);
}

export function listingsAreEqual(
  local: LocalListing,
  remote: Listing
): boolean {
  const l: Listing = Object.keys(local).reduce(
    (listing: Listing, key: string) => {
      const { size, modtime } = local[key];

      listing[key] = {
        size: size.toString(),
        modtime,
      } as unknown as ListingData;

      return listing;
    },
    {}
  );

  Logger.debug('l', l);
  Logger.debug('remote', remote);

  return _.isEqual(l, remote);
}
