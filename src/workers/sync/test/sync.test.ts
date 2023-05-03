// @ts-nocheck
import { toHaveBeenCalledBefore } from 'jest-extended';
import { Readable } from 'stream';

import {
  ErrorDetails,
  FileSystem,
  Listing,
  ProcessFatalError,
} from '../../types';
import { convertActionsToQueues } from '../Actions/application/ConvertActionsToQueues';
import { generateHierarchyActions } from '../Actions/application/GenerateHierarchyActions';
import { generateDeltas } from '../ItemState/application/GenerateDeltas';
import { ItemState } from '../ItemState/domain/ItemState';
import { LocalItemMetaData } from '../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../Listings/domain/RemoteItemMetaData';
import { SynchronizedItemMetaData } from '../Listings/domain/SynchronizedItemMetaData';
import Sync from '../sync';

expect.extend({ toHaveBeenCalledBefore });

describe('sync tests', () => {
  const mockBase: () => FileSystem = () => ({
    kind: 'LOCAL',
    async getCurrentListing() {
      return { listing: {}, readingMetaErrors: [] };
    },
    async deleteFile() {
      // no-op
    },
    async pullFile() {
      // no-op
    },
    async renameFile() {
      // no-op
    },
    async existsFolder() {
      return false;
    },
    async deleteFolder() {
      // no-op
    },
    async getSource() {
      return {
        modTime: 4,
        size: 4,
        isFolder: false,
        stream: {} as Readable,
      };
    },
    async smokeTest() {
      // no-op
    },
  });

  function setupEventSpies(sync: Sync) {
    const smokeTestingCB = jest.fn();
    const checkingLastRunCB = jest.fn();
    const needResyncCB = jest.fn();
    const generatingActionsCB = jest.fn();
    const pullingFileCB = jest.fn();
    const pulledFileCB = jest.fn();
    const deletingFileCB = jest.fn();
    const deletedFileCB = jest.fn();
    const deletingFolderCB = jest.fn();
    const deletedFolderCB = jest.fn();
    const renamingFileCB = jest.fn();
    const renamedFileCB = jest.fn();
    const finalizingCB = jest.fn();
    const actionsGeneratedCB = jest.fn();
    const folderPulledCB = jest.fn();

    sync.on('SMOKE_TESTING', smokeTestingCB);
    sync.on('CHECKING_LAST_RUN_OUTCOME', checkingLastRunCB);
    sync.on('NEEDS_RESYNC', needResyncCB);
    sync.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', generatingActionsCB);
    sync.on('PULLING_FILE', pullingFileCB);
    sync.on('FILE_PULLED', pulledFileCB);
    sync.on('DELETING_FILE', deletingFileCB);
    sync.on('FILE_DELETED', deletedFileCB);
    sync.on('DELETING_FOLDER', deletingFolderCB);
    sync.on('FOLDER_DELETED', deletedFolderCB);
    sync.on('RENAMING_FILE', renamingFileCB);
    sync.on('FILE_RENAMED', renamedFileCB);
    sync.on('FINALIZING', finalizingCB);
    sync.on('ACTION_QUEUE_GENERATED', actionsGeneratedCB);
    sync.on('FOLDER_PULLED', folderPulledCB);

    return {
      smokeTestingCB,
      checkingLastRunCB,
      needResyncCB,
      generatingActionsCB,
      pullingFileCB,
      pulledFileCB,
      deletingFileCB,
      deletedFileCB,
      deletingFolderCB,
      deletedFolderCB,
      renamingFileCB,
      renamedFileCB,
      finalizingCB,
      actionsGeneratedCB,
      folderPulledCB,
    };
  }

  function listingStore(): ListingStore {
    return {
      async getLastSavedListing() {
        return null;
      },
      async removeSavedListing() {
        // no op
      },
      async saveListing() {
        // no op
      },
    };
  }

  function dummySync() {
    return new Sync(mockBase(), mockBase(), listingStore());
  }

  it('should do resync correctly', async () => {
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            notExistInRemote: LocalItemMetaData.from({
              modtime: 40,
              size: 1,
              isFolder: false,
              dev: 1,
              ino: 6537,
            }),
            existInBothButIsTheSame: LocalItemMetaData.from({
              modtime: 30,
              size: 2,
              isFolder: false,
              dev: 1,
              ino: 9941,
            }),
            'folder/nested/existInBoth.txt': LocalItemMetaData.from({
              modtime: 44,
              size: 3,
              isFolder: false,
              dev: 1,
              ino: 8783,
            }),
          },
          readingMetaErrors: [],
        };
      },
    };

    const remote: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            notExistInLocal: RemoteItemMetaData.from({
              modtime: 40,
              size: 1,
              isFolder: false,
              id: 304,
            }),
            existInBothButIsTheSame: RemoteItemMetaData.from({
              modtime: 30,
              size: 2,
              isFolder: false,
              id: 1345,
            }),
            'folder/nested/existInBoth.txt': RemoteItemMetaData.from({
              modtime: 55,
              size: 3,
              isFolder: false,
              id: 968,
            }),
          },
          readingMetaErrors: [],
        };
      },
    };

    const sync = new Sync(local, remote, listingStore(), { remote, local });

    const {
      smokeTestingCB,
      checkingLastRunCB,
      needResyncCB,
      generatingActionsCB,
      pullingFileCB,
      pulledFileCB,
      deletingFileCB,
      deletedFileCB,
      renamingFileCB,
      renamedFileCB,
      finalizingCB,
      actionsGeneratedCB,
    } = setupEventSpies(sync);

    const spyRemotePull = jest.spyOn(remote, 'pullFile');

    const spyLocalPull = jest.spyOn(local, 'pullFile');

    await sync.run();

    expect(spyRemotePull).toHaveBeenCalledWith(
      'notExistInRemote',
      expect.anything(),
      expect.anything()
    );
    expect(spyLocalPull).toHaveBeenCalledWith(
      'folder/nested/existInBoth.txt',
      expect.anything(),
      expect.anything()
    );

    expect(spyLocalPull).toHaveBeenCalledWith(
      'notExistInLocal',
      expect.anything(),
      expect.anything()
    );

    expect(smokeTestingCB).toBeCalledTimes(1);
    expect(checkingLastRunCB).toBeCalledTimes(1);
    expect(needResyncCB).toBeCalledTimes(1);
    expect(generatingActionsCB).toBeCalledTimes(0);
    expect(pullingFileCB).toBeCalledTimes(3);
    expect(pulledFileCB).toBeCalledTimes(3);
    expect(deletingFileCB).toBeCalledTimes(0);
    expect(deletedFileCB).toBeCalledTimes(0);
    expect(renamingFileCB).toBeCalledTimes(0);
    expect(renamedFileCB).toBeCalledTimes(0);
    expect(finalizingCB).toBeCalledTimes(1);
    expect(actionsGeneratedCB).toBeCalledTimes(1);
  });

  it('should do a default run correctly', async () => {
    const listingStoreMocked: ListingStore = {
      ...listingStore(),
      async getLastSavedListing() {
        return {
          'newer/newer/different': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 2842,
            id: 1003,
          }),
          'newer/newer/same': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 9677,
            id: 6953,
          }),
          'newer/deleted': SynchronizedItemMetaData.from({
            modtime: 5,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 5656,
          }),
          'newer/older': SynchronizedItemMetaData.from({
            modtime: 5,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 2011,
            id: 343,
          }),
          'newer/unchanged': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 5172,
            id: 7690,
          }),
          'deleted/newer': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 6900,
            id: 7339,
          }),
          'deleted/deleted': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 41,
            id: 6662,
          }),
          'deleted/older': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 1889,
            id: 2299,
          }),
          'deleted/unchanged': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 397,
            id: 3896,
          }),
          'older/newer': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 5273,
            id: 3010,
          }),
          'older/deleted': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 5953,
            id: 4618,
          }),
          'older/older/same': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 6992,
            id: 2148,
          }),
          'older/older/different': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 9689,
            id: 1238,
          }),
          'older/unchanged': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 897,
            id: 7430,
          }),
          'unchanged/newer': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 511,
            id: 3072,
          }),
          'unchanged/deleted': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 4791,
            id: 157,
          }),
          'unchanged/older': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 4248,
            id: 1483,
          }),
          'unchanged/unchanged': SynchronizedItemMetaData.from({
            modtime: 4,
            size: 4,
            isFolder: false,
            dev: 1,
            ino: 8571,
            id: 9277,
          }),
        };
      },
    };
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            'new/new/different': LocalItemMetaData.from({
              modtime: 4,
              size: 3,
              isFolder: false,
              ino: 3641,
              dev: 1,
            }),
            'new/new/same': LocalItemMetaData.from({
              modtime: 4,
              size: 3,
              isFolder: false,
              ino: 4648,
              dev: 1,
            }),
            'new/noexist': LocalItemMetaData.from({
              modtime: 43,
              size: 3,
              isFolder: false,
              ino: 8399,
              dev: 1,
            }),
            'newer/newer/different': LocalItemMetaData.from({
              modtime: 6,
              size: 3,
              isFolder: false,
              ino: 2842,
              dev: 1,
            }),
            'newer/newer/same': LocalItemMetaData.from({
              modtime: 5,
              size: 3,
              isFolder: false,
              ino: 9677,
              dev: 1,
            }),
            'newer/deleted': LocalItemMetaData.from({
              modtime: 6,
              size: 3,
              isFolder: false,
              ino: 5656,
              dev: 1,
            }),
            'newer/older': LocalItemMetaData.from({
              modtime: 6,
              size: 3,
              isFolder: false,
              ino: 2011,
              dev: 1,
            }),
            'newer/unchanged': LocalItemMetaData.from({
              modtime: 5,
              size: 3,
              isFolder: false,
              ino: 5172,
              dev: 1,
            }),
            'older/newer': LocalItemMetaData.from({
              modtime: 3,
              size: 3,
              isFolder: false,
              ino: 5273,
              dev: 1,
            }),
            'older/deleted': LocalItemMetaData.from({
              modtime: 3,
              size: 3,
              isFolder: false,
              ino: 5953,
              dev: 1,
            }),
            'older/older/same': LocalItemMetaData.from({
              modtime: 3,
              size: 3,
              isFolder: false,
              ino: 6992,
              dev: 1,
            }),
            'older/older/different': LocalItemMetaData.from({
              modtime: 3,
              size: 3,
              isFolder: false,
              ino: 9689,
              dev: 1,
            }),
            'older/unchanged': LocalItemMetaData.from({
              modtime: 3,
              size: 3,
              isFolder: false,
              ino: 897,
              dev: 1,
            }),
            'unchanged/newer': LocalItemMetaData.from({
              modtime: 4,
              size: 3,
              isFolder: false,
              ino: 511,
              dev: 1,
            }),
            'unchanged/deleted': LocalItemMetaData.from({
              modtime: 4,
              size: 3,
              isFolder: false,
              ino: 4791,
              dev: 1,
            }),
            'unchanged/older': LocalItemMetaData.from({
              modtime: 4,
              size: 3,
              isFolder: false,
              ino: 4248,
              dev: 1,
            }),
            'unchanged/unchanged': LocalItemMetaData.from({
              modtime: 4,
              size: 3,
              isFolder: false,
              ino: 8571,
              dev: 1,
            }),
          },
          readingMetaErrors: [],
        };
      },
    };

    const remote: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            'new/new/different': RemoteItemMetaData.from({
              modtime: 5,
              size: 1,
              isFolder: false,
              id: 8145,
            }),
            'new/new/same': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 5134,
            }),
            'newer/newer/different': RemoteItemMetaData.from({
              modtime: 5,
              size: 1,
              isFolder: false,
              id: 1003,
            }),
            'newer/newer/same': RemoteItemMetaData.from({
              modtime: 5,
              size: 1,
              isFolder: false,
              id: 6953,
            }),
            'newer/older': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 343,
            }),
            'newer/unchanged': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 7690,
            }),
            'deleted/newer': RemoteItemMetaData.from({
              modtime: 5,
              size: 1,
              isFolder: false,
              id: 7339,
            }),
            'deleted/older': RemoteItemMetaData.from({
              modtime: 3,
              size: 1,
              isFolder: false,
              id: 2299,
            }),
            'deleted/unchanged': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 3896,
            }),
            'older/newer': RemoteItemMetaData.from({
              modtime: 5,
              size: 1,
              isFolder: false,
              id: 3010,
            }),
            'older/older/same': RemoteItemMetaData.from({
              modtime: 3,
              size: 1,
              isFolder: false,
              id: 2148,
            }),
            'older/older/different': RemoteItemMetaData.from({
              modtime: 2,
              size: 1,
              isFolder: false,
              id: 1238,
            }),
            'older/unchanged': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 7430,
            }),
            'unchanged/newer': RemoteItemMetaData.from({
              modtime: 5,
              size: 1,
              isFolder: false,
              id: 3072,
            }),
            'unchanged/older': RemoteItemMetaData.from({
              modtime: 3,
              size: 1,
              isFolder: false,
              id: 1483,
            }),
            'unchanged/unchanged': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 9277,
            }),
            'noexist/new': RemoteItemMetaData.from({
              modtime: 4,
              size: 1,
              isFolder: false,
              id: 7681,
            }),
          },
          readingMetaErrors: [],
        };
      },
    };

    const sync = new Sync(local, remote, listingStoreMocked);

    const {
      smokeTestingCB,
      checkingLastRunCB,
      needResyncCB,
      generatingActionsCB,
      pullingFileCB,
      pulledFileCB,
      deletingFileCB,
      deletedFileCB,
      deletingFolderCB,
      deletedFolderCB,
      finalizingCB,
      actionsGeneratedCB,
    } = setupEventSpies(sync);

    const spyRemotePull = jest.spyOn(remote, 'pullFile');
    const spyRemoteDelete = jest.spyOn(remote, 'deleteFile');
    const spyRemoteDeleteFolder = jest.spyOn(remote, 'deleteFolder');

    const spyLocalPull = jest.spyOn(local, 'pullFile');
    const spyLocalDelete = jest.spyOn(local, 'deleteFile');
    const spyLocalDeleteFolder = jest.spyOn(local, 'deleteFolder');
    await sync.run();

    const expectPullRemote = [
      'new/noexist',
      'newer/deleted',
      'newer/unchanged',
      'newer/older',
      'older/deleted',
      'older/older/different',
      'newer/newer/different',
      'older/unchanged',
    ];
    const expectPullLocal = [
      'new/new/different',
      'noexist/new',
      'deleted/newer',
      'older/newer',
      'unchanged/newer',
      'deleted/older',
      'unchanged/older',
    ];
    const notExpectPullRemote = [
      'new/new/same_local',
      'newer/newer/same_local',
      'unchanged/unchanged',
      'older/older/same_local',
    ];
    const notExpectPullLocal = [
      'new/new/same_remote',
      'newer/newer/same_remote',
      'unchanged/unchanged',
      'older/older/same_remote',
    ];

    expectPullRemote.forEach((name) =>
      expect(spyRemotePull).toBeCalledWith(
        name,
        expect.anything(),
        expect.anything()
      )
    );
    expectPullLocal.forEach((name) =>
      expect(spyLocalPull).toBeCalledWith(
        name,
        expect.anything(),
        expect.anything()
      )
    );

    notExpectPullRemote.forEach((name) =>
      expect(spyRemotePull).not.toBeCalledWith(
        name,
        expect.anything(),
        expect.anything()
      )
    );
    notExpectPullLocal.forEach((name) =>
      expect(spyLocalPull).not.toBeCalledWith(
        name,
        expect.anything(),
        expect.anything()
      )
    );

    expect(spyLocalDelete).not.toBeCalledWith('deleted/deleted');
    expect(spyRemoteDelete).not.toBeCalledWith('deleted/deleted');

    expect(spyLocalDelete).toBeCalledWith('unchanged/deleted');
    expect(spyRemoteDelete).not.toBeCalledWith('deleted/unchanged');

    expect(spyRemoteDeleteFolder).toBeCalledWith('deleted');
    expect(spyLocalDeleteFolder).not.toBeCalled();

    expect(smokeTestingCB).toBeCalledTimes(1);
    expect(checkingLastRunCB).toBeCalledTimes(1);
    expect(needResyncCB).toBeCalledTimes(0);
    expect(generatingActionsCB).toBeCalledTimes(1);

    const expectedPulls = expectPullLocal.length + expectPullRemote.length;
    expect(pullingFileCB).toBeCalledTimes(expectedPulls);
    expect(pulledFileCB).toBeCalledTimes(expectedPulls);

    expect(deletingFileCB).toBeCalledTimes(1);
    expect(deletedFileCB).toBeCalledTimes(1);

    expect(deletingFolderCB).toBeCalledTimes(1);
    expect(deletedFolderCB).toBeCalledTimes(1);

    expect(finalizingCB).toBeCalledTimes(1);
    expect(actionsGeneratedCB).toBeCalledTimes(1);
  });

  it('should rename correctly', () => {
    const sync = dummySync();

    expect(sync.rename('whatever', 'sufix')).toBe('whatever_sufix');

    expect(sync.rename('whatever.txt', 'sufix')).toBe('whatever_sufix.txt');

    expect(sync.rename('nested/whatever.txt', 'sufix')).toBe(
      'nested/whatever_sufix.txt'
    );

    expect(sync.rename('nested/deep/whatever.txt', 'sufix')).toBe(
      'nested/deep/whatever_sufix.txt'
    );

    expect(sync.rename('nested/deep/whatever', 'sufix')).toBe(
      'nested/deep/whatever_sufix'
    );

    expect(sync.rename('.hidden', 'sufix')).toBe('.hidden_sufix');

    expect(sync.rename('.hidden.txt', 'sufix')).toBe('.hidden_sufix.txt');

    expect(sync.rename('nested/.hidden.txt', 'sufix')).toBe(
      'nested/.hidden_sufix.txt'
    );

    expect(sync.rename('nested/.hidden', 'sufix')).toBe('nested/.hidden_sufix');
  });

  it('should generate deltas correctly', () => {
    const savedListing = {
      unchanged: { modtime: 44, size: 1, isFolder: false },
      newer: { modtime: 44, size: 1, isFolder: false },
      older: { modtime: 44, size: 1, isFolder: false },
      deleted: { modtime: 44, size: 1, isFolder: false },
    };

    const currentListing = {
      unchanged: { modtime: 44, size: 1, isFolder: false },
      newer: { modtime: 45, size: 1, isFolder: false },
      older: { modtime: 43, size: 1, isFolder: false },
      new: { modtime: 44, size: 1, isFolder: false },
    };

    const deltas = generateDeltas(savedListing, currentListing);

    expect(deltas.unchanged.is('UNCHANGED')).toBe(true);
    expect(deltas.newer.is('NEWER')).toBe(true);
    expect(deltas.older.is('OLDER')).toBe(true);
    expect(deltas.deleted.is('DELETED')).toBe(true);
    expect(deltas.new.is('NEW')).toBe(true);
  });

  it('should generate action queues correctly', () => {
    const localListing: Listing = {
      a: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 137,
        dev: 1,
      }),
      aa: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 6488,
        dev: 1,
      }),
      b: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 4800,
        dev: 1,
      }),

      c: LocalItemMetaData.from({
        modtime: 1,
        size: 1,
        isFolder: false,
        ino: 9250,
        dev: 1,
      }),
      cc: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 8005,
        dev: 1,
      }),
      d: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 6075,
        dev: 1,
      }),
      e: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 2364,
        dev: 1,
      }),
      f: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 1074,
        dev: 1,
      }),

      k: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 6903,
        dev: 1,
      }),
      m: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 9749,
        dev: 1,
      }),
      n: LocalItemMetaData.from({
        modtime: 1,
        size: 1,
        isFolder: false,
        ino: 768,
        dev: 1,
      }),
      nn: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 735,
        dev: 1,
      }),
      l: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 8519,
        dev: 1,
      }),

      o: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 7390,
        dev: 1,
      }),
      p: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 1132,
        dev: 1,
      }),
      q: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 4851,
        dev: 1,
      }),
      r: LocalItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        ino: 4260,
        dev: 1,
      }),
    };

    const remoteListing: Listing = {
      a: RemoteItemMetaData.from({
        modtime: 1,
        size: 1,
        isFolder: false,
        id: 637,
      }),
      aa: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 4732,
      }),
      b: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 3611,
      }),

      c: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 5178,
      }),
      cc: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 3661,
      }),
      e: RemoteItemMetaData.from({
        modtime: 1,
        size: 1,
        isFolder: false,
        id: 5569,
      }),
      f: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 4707,
      }),

      g: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 1932,
      }),
      h: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 6464,
      }),
      i: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 5056,
      }),
      j: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 4754,
      }),

      k: RemoteItemMetaData.from({
        modtime: 3,
        size: 1,
        isFolder: false,
        id: 4021,
      }),
      n: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 2032,
      }),
      nn: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 6138,
      }),
      l: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 9149,
      }),

      o: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 4038,
      }),
      q: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 1892,
      }),
      r: RemoteItemMetaData.from({
        modtime: 2,
        size: 1,
        isFolder: false,
        id: 7338,
      }),

      s: RemoteItemMetaData.from({
        modtime: 6,
        size: 8,
        isFolder: false,
        id: 99,
      }),
    };

    const deltasLocal: Deltas = {
      a: new ItemState('NEW'),
      aa: new ItemState('NEW'),
      b: new ItemState('NEW'),

      c: new ItemState('NEWER'),
      cc: new ItemState('NEWER'),
      d: new ItemState('NEWER'),
      e: new ItemState('NEWER'),
      f: new ItemState('NEWER'),

      g: new ItemState('DELETED'),
      i: new ItemState('DELETED'),
      j: new ItemState('DELETED'),

      k: new ItemState('OLDER'),
      m: new ItemState('OLDER'),
      n: new ItemState('OLDER'),
      nn: new ItemState('OLDER'),
      l: new ItemState('OLDER'),

      o: new ItemState('UNCHANGED'),
      p: new ItemState('UNCHANGED'),
      q: new ItemState('UNCHANGED'),
      r: new ItemState('UNCHANGED'),
    };

    const deltasRemote: Deltas = {
      a: new ItemState('NEW'),
      aa: new ItemState('NEW'),

      c: new ItemState('NEWER'),
      cc: new ItemState('NEWER'),
      d: new ItemState('DELETED'),
      e: new ItemState('OLDER'),
      f: new ItemState('UNCHANGED'),

      g: new ItemState('NEWER'),
      h: new ItemState('DELETED'),
      i: new ItemState('OLDER'),
      j: new ItemState('UNCHANGED'),

      k: new ItemState('NEWER'),
      m: new ItemState('DELETED'),
      n: new ItemState('OLDER'),
      nn: new ItemState('OLDER'),
      l: new ItemState('UNCHANGED'),

      o: new ItemState('NEWER'),
      p: new ItemState('DELETED'),
      q: new ItemState('OLDER'),
      r: new ItemState('UNCHANGED'),

      s: new ItemState('NEW'),
    };

    const actions = generateHierarchyActions(
      deltasLocal,
      deltasRemote,
      localListing,
      remoteListing
    );

    const { pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote } =
      convertActionsToQueues(actions).file;

    expect(pullFromLocal.sort()).toEqual(
      ['c', 'g', 'i', 'n', 'k', 'o', 'q', 's'].sort()
    );
    expect(pullFromRemote.sort()).toEqual(
      ['a', 'b', 'e', 'd', 'f', 'm', 'l'].sort()
    );

    expect(deleteInLocal).toEqual(['p']);
    expect(deleteInRemote).toEqual(['j']);
  });

  it('should detect folder that has been deleted', async () => {
    const sync = dummySync();

    const savedListing: Listing = {
      a: { modtime: 4, size: 1, isFolder: false },
      b: { modtime: 4, size: 1, isFolder: false },
      'c/d': { modtime: 5, size: 1, isFolder: false },
      'c/e': { modtime: 6, size: 1, isFolder: false },
      'c/f': { modtime: 7, size: 1, isFolder: false },
      'd/a': { modtime: 2, size: 1, isFolder: false },
      'd/b': { modtime: 2, size: 1, isFolder: false },
      'e/a': { modtime: 1, size: 1, isFolder: false },
      'e/b': { modtime: 2, size: 1, isFolder: false },
      'nested/quite/a': { modtime: 1, size: 1, isFolder: false },
      'nested/quite/b': { modtime: 1, size: 1, isFolder: false },
      'nested/dontDisapear/a': { modtime: 1, size: 1, isFolder: false },
      'nested/dontDisapear/b': { modtime: 1, size: 1, isFolder: false },
      'disapear/but/returnfalse': { modtime: 2, size: 1, isFolder: false },
    };

    const currentListing: Listing = {
      a: { modtime: 4, size: 1, isFolder: false },
      'c/d': { modtime: 5, size: 1, isFolder: false },
      'c/e': { modtime: 6, size: 1, isFolder: false },
      'c/f': { modtime: 7, size: 1, isFolder: false },
      'd/a': { modtime: 2, size: 1, isFolder: false },
      'nested/dontDisapear/a': { modtime: 1, size: 1, isFolder: false },
    };

    const fileSystem = {
      async existsFolder(name: string) {
        return name === 'disapear/but' || name === 'disapear';
      },
    };

    const result = await sync.listDeletedFolders(
      savedListing,
      currentListing,
      fileSystem
    );

    expect(result.sort()).toEqual(['e', 'nested/quite'].sort());
  });

  it('should emit a fatal error if smoke testing fails', async () => {
    expect.assertions(1);

    const fsFailing = mockBase();
    const sync = new Sync(fsFailing, mockBase(), listingStore());

    jest.spyOn(fsFailing, 'smokeTest').mockImplementation(async () => {
      throw new ProcessFatalError('NO_INTERNET', {} as ErrorDetails);
    });

    try {
      await sync.run();
    } catch (err) {
      expect(err.name).toBe('NO_INTERNET');
    }
  });

  it('should emit a fatal error if get current listings fails', async () => {
    expect.assertions(1);

    const fsFailing = mockBase();
    const sync = new Sync(fsFailing, mockBase(), listingStore());

    jest.spyOn(fsFailing, 'getCurrentListing').mockImplementation(async () => {
      throw new Error();
    });

    try {
      await sync.run();
    } catch (err) {
      expect(err.name).toBe('CANNOT_GET_CURRENT_LISTINGS');
    }
  });

  it('should compute correctly the listing diff', async () => {
    const sync = new Sync(mockBase(), mockBase(), listingStore());

    const local: Listing = {
      imsync: LocalItemMetaData.from({
        modtime: 4,
        size: 5,
        isFolder: false,
        ino: 0,
        dev: 0,
      }),
      imnotinremote: LocalItemMetaData.from({
        modtime: 4,
        size: 5,
        isFolder: false,
        ino: 1,
        dev: 1,
      }),
      imindiffmodtimes: LocalItemMetaData.from({
        modtime: 4,
        size: 5,
        isFolder: false,
        ino: 2,
        dev: 2,
      }),
    };

    const remote: Listing = {
      imsync: RemoteItemMetaData.from({
        modtime: 4,
        size: 5,
        isFolder: false,
        id: 0,
      }),
      imnotinlocal: RemoteItemMetaData.from({
        modtime: 4,
        size: 5,
        isFolder: false,
        id: 1,
      }),
      imindiffmodtimes: RemoteItemMetaData.from({
        modtime: 8,
        size: 5,
        isFolder: false,
        id: 2,
      }),
    };

    const diff = sync.getListingsDiff(local, remote);

    expect(diff.filesNotInLocal.length).toEqual(1);
    expect(
      diff.filesNotInLocal.find((el) => el === 'imnotinlocal')
    ).toBeDefined();

    expect(diff.filesNotInRemote.length).toEqual(1);
    expect(
      diff.filesNotInRemote.find((el) => el === 'imnotinremote')
    ).toBeDefined();

    expect(diff.filesWithDifferentModtime.length).toEqual(1);
    expect(
      diff.filesWithDifferentModtime.find((el) => el === 'imindiffmodtimes')
    ).toBeDefined();

    expect(Object.entries(diff.filesInSync).length).toEqual(1);
    expect(diff.filesInSync.imsync).toMatchObject({
      modtime: 4,
      size: 5,
      isFolder: false,
    });
  });

  it('pulls the folders on remote before the files', async () => {
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            folder: LocalItemMetaData.from({
              modtime: 4,
              size: 5,
              isFolder: true,
              dev: 1,
              ino: 76,
            }),
            'folder/fileA': LocalItemMetaData.from({
              modtime: 4,
              size: 5,
              isFolder: false,
              dev: 1,
              ino: 553,
            }),
            'folder/fileB': LocalItemMetaData.from({
              modtime: 4,
              size: 5,
              isFolder: false,
              dev: 1,
              ino: 85,
            }),
          },
          readingMetaErrors: [],
        };
      },
    };

    const remote: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          readingMetaErrors: [],
          listing: [],
        };
      },
      pullFolder: jest.fn().mockResolvedValue(),
    };

    const listingStoreMocked: ListingStore = {
      ...listingStore(),
      async getLastSavedListing() {
        return {};
      },
    };

    const sync = new Sync(local, remote, listingStoreMocked);

    const { folderPulledCB, pullingFileCB } = setupEventSpies(sync);

    await sync.run();

    expect(folderPulledCB).toHaveBeenCalledBefore(pullingFileCB);
  });
});
