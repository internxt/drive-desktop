import _ from 'lodash';
import { Delta, Deltas, Status } from '../sync/Deltas';
import { Listing, ListingData, LocalListing, LocalListingData } from '../types';
import { Tuple } from './types';

export type OldName = string;
export type NewName = string;

export function cannotCheck(...listings: Array<LocalListing>): boolean {
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

export function reindexByType(deltas: Deltas): DeltasByType {
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

// export function generateRenameDeltas(
//   deltas: Deltas,
//   old: LocalListing,
//   current: LocalListing
// ): Deltas {
//   if (cannotCheck(old, current)) {
//     return {};
//   }

//   if (thereAreNewerDeltasAndTheyAreFiles(deltas)) return {};

//   const deltasByType = index(deltas);

//   if (
//     (['OLDER', 'NEW_NAME', 'RENAMED'] as Status[]).some(
//       (delta) => deltasByType[delta].length !== 0
//     )
//   )
//     return {};

//   if (deltasByType.NEW.length !== deltasByType.DELETED.length) return {};

//   if (deltasByType.NEW.length === 0) return {};

//   const created = deltasByType.NEW;
//   const deleted = deltasByType.DELETED;

//   const itemsCreated = created.map(
//     (name: string): Tuple<string, LocalListingData> => [name, current[name]]
//   );

//   const itemsDeleted = deleted.map(
//     (name: string): Tuple<string, LocalListingData> => [name, old[name]]
//   );

//   const r = itemsCreated.reduce(
//     (
//       renameDeltas: { FOLDER: Deltas; FILE: Deltas },
//       [newName, createdData]: Tuple<string, LocalListingData>
//     ) => {
//       const result = itemsDeleted.find(
//         ([, { dev, ino }]) => dev === createdData.dev && ino === createdData.ino
//       );

//       if (!result) return renameDeltas;

//       const [oldName, deletedData] = result;

//       const kind = deletedData.isFolder ? 'FOLDER' : 'FILE';

//       renameDeltas[kind][oldName] = new Delta('RENAMED', kind, [
//         newName,
//         'NEW_NAME',
//       ]);
//       renameDeltas[kind][newName] = new Delta('NEW_NAME', kind, [
//         oldName,
//         'RENAMED',
//       ]);

//       return renameDeltas;
//     },
//     { FOLDER: {}, FILE: {} }
//   );

//   if (Object.keys(r.FOLDER).length === 0) {
//     return r.FILE;
//   }

//   return filterFileRenamesInsideFolder(r);
// }

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

const parentFolers = (filePath: string): Array<string> => {
  const paths = filePath.split('/');
  paths.pop();

  return paths;
};

const searchForDelta = (
  deltas: Deltas,
  fileStatus: Status,
  fileParentFolers: Array<string>
) =>
  Object.entries(deltas).find(([folderName, { status }]) => {
    const folders = folderName.split('/');

    return _.isEqual(folders, fileParentFolers) && fileStatus === status;
  });

export function filterFileRenamesInsideFolder(allDeltas: {
  FOLDER: Deltas;
  FILE: Deltas;
}) {
  const isolatedRenames: Deltas = {};

  for (const [name, data] of Object.entries(allDeltas.FILE)) {
    if (data.status !== 'RENAMED' && data.status !== 'NEW_NAME') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const fileParentFolders = parentFolers(name);
    const folderDelta = searchForDelta(
      allDeltas.FOLDER,
      data.status,
      fileParentFolders
    );

    if (!folderDelta) {
      isolatedRenames[name] = data;
    }
  }

  for (const [name, data] of Object.entries(allDeltas.FOLDER)) {
    if (data.status !== 'RENAMED' && data.status !== 'NEW_NAME') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const folderParentFolders = parentFolers(name);
    const folderDelta = searchForDelta(
      allDeltas.FOLDER,
      data.status,
      folderParentFolders
    );

    if (!folderDelta) {
      isolatedRenames[name] = data;
    }
  }

  for (const [name, data] of Object.entries(allDeltas.FILE)) {
    // Once we have the folder renames we can set the files on a renamed folder to UNCHAGNED
    if (data.status !== 'RENAMED' && data.status !== 'NEW_NAME') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const fileParentFolders = parentFolers(name);
    const folderDelta = searchForDelta(
      isolatedRenames,
      data.status,
      fileParentFolders
    );

    if (folderDelta) {
      isolatedRenames[name] = new Delta(
        'UNCHANGED',
        data.itemKind === 'FOLDER'
      );
    }
  }

  for (const [name, data] of Object.entries(allDeltas.FOLDER)) {
    if (data.status !== 'RENAMED' && data.status !== 'NEW_NAME') {
      // eslint-disable-next-line no-continue
      continue;
    }

    const folderParentFolders = parentFolers(name);
    const folderDelta = searchForDelta(
      allDeltas.FOLDER,
      data.status,
      folderParentFolders
    );

    if (folderDelta) {
      isolatedRenames[name] = new Delta(
        'UNCHANGED',
        data.itemKind === 'FOLDER'
      );
    }
  }

  return isolatedRenames;
}

export function mergeDeltas(...deltas: Array<Deltas>): Deltas {
  // Merges all deltas overriding them if they match
  const result: Deltas = {};

  for (const d of deltas) {
    for (const [name, value] of Object.entries(d)) {
      result[name] = value;
    }
  }

  return result;
}
