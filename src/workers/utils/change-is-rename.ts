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
    [newName]: new Delta('NEW_NAME', created.isFolder, [oldName, 'RENAMED']),
    [oldName]: new Delta('RENAMED', deleted.isFolder, [newName, 'NEW_NAME']),
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

export function checkFolderRename(created: Listing, deleted: Listing): Deltas {
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

  const itemsCreated = created.map(
    (name: string): Tuple<string, LocalListingData> => [name, current[name]]
  );

  const itemsDeleted = deleted.map(
    (name: string): Tuple<string, LocalListingData> => [name, old[name]]
  );

  const r = itemsCreated.reduce(
    (
      renameDeltas: { FOLDER: Deltas; FILE: Deltas },
      [newName, createdData]: Tuple<string, LocalListingData>
    ) => {
      const result = itemsDeleted.find(
        ([, { dev, ino }]) => dev === createdData.dev && ino === createdData.ino
      );

      if (!result) return renameDeltas;

      const [oldName, deletedData] = result;

      const kind = deletedData.isFolder ? 'FOLDER' : 'FILE';

      renameDeltas[kind][oldName] = new Delta('RENAMED', kind, [
        newName,
        'NEW_NAME',
      ]);
      renameDeltas[kind][newName] = new Delta('NEW_NAME', kind, [
        oldName,
        'RENAMED',
      ]);

      return renameDeltas;
    },
    { FOLDER: {}, FILE: {} }
  );

  if (Object.keys(r.FOLDER).length === 0) {
    return r.FILE;
  }

  return filterFileRenamesInsideFolder(r);
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

function filterFileRenamesInsideFolder(r: { FOLDER: Deltas; FILE: Deltas }) {
  const isolatedRenames: Deltas = {};

  const parentFolers = (filePath: string): Array<string> => {
    const paths = filePath.split('/');
    paths.pop();

    return paths;
  };

  const searchForDelta = (
    fileStatus: Status,
    fileParentFolers: Array<string>
  ) =>
    Object.entries(r.FOLDER).find(([folderName, { status }]) => {
      const folders = folderName.split('/');

      return _.isEqual(folders, fileParentFolers) && fileStatus === status;
    });

  for (const [name, data] of Object.entries(r.FILE)) {
    if (data.status !== 'RENAMED' && data.status !== 'NEW_NAME') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const fileParentFolders = parentFolers(name);
    const folderDelta = searchForDelta(data.status, fileParentFolders);

    if (!folderDelta) {
      isolatedRenames[name] = data;
    }
  }

  for (const [name, data] of Object.entries(r.FOLDER)) {
    if (data.status !== 'RENAMED' && data.status !== 'NEW_NAME') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const folderParentFolders = parentFolers(name);
    const folderDelta = searchForDelta(data.status, folderParentFolders);

    if (!folderDelta) {
      isolatedRenames[name] = data;
    }
  }

  return isolatedRenames;
}
