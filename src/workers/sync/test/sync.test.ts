/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-empty-function */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Readable } from 'stream';
import Sync, { Deltas, ListingStore } from '../sync';
import {
  ErrorDetails,
  FileSystem,
  Listing,
  ProcessFatalError,
} from '../../types';

describe('sync tests', () => {
  const mockBase: () => FileSystem = () => ({
    kind: 'LOCAL',
    async getCurrentListing() {
      return { listing: {}, readingMetaErrors: [] };
    },
    async deleteFile() {},
    async pullFile() {},
    async renameFile() {},
    async existsFolder() {
      return false;
    },
    async deleteFolder() {},
    async getSource() {
      return {
        modTime: 4,
        size: 4,
        stream: {} as Readable,
      };
    },
    async smokeTest() {},
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
    };
  }

  function listingStore(): ListingStore {
    return {
      async getLastSavedListing() {
        return null;
      },
      async removeSavedListing() {},
      async saveListing() {},
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
            notExistInRemote: { modtime: 40, size: 1 },
            existInBothButIsTheSame: { modtime: 30, size: 2 },
            'folder/nested/existInBoth.txt': { modtime: 44, size: 3 },
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
            notExistInLocal: { modtime: 40, size: 1 },
            existInBothButIsTheSame: { modtime: 30, size: 2 },
            'folder/nested/existInBoth.txt': { modtime: 55, size: 3 },
          },
          readingMetaErrors: [],
        };
      },
    };

    const sync = new Sync(local, remote, listingStore());

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
          'newer/newer/different': { modtime: 4, size: 4 },
          'newer/newer/same': { modtime: 4, size: 4 },
          'newer/deleted': { modtime: 5, size: 4 },
          'newer/older': { modtime: 5, size: 4 },
          'newer/unchanged': { modtime: 4, size: 4 },
          'deleted/newer': { modtime: 4, size: 4 },
          'deleted/deleted': { modtime: 4, size: 4 },
          'deleted/older': { modtime: 4, size: 4 },
          'deleted/unchanged': { modtime: 4, size: 4 },
          'older/newer': { modtime: 4, size: 4 },
          'older/deleted': { modtime: 4, size: 4 },
          'older/older/same': { modtime: 4, size: 4 },
          'older/older/different': { modtime: 4, size: 4 },
          'older/unchanged': { modtime: 4, size: 4 },
          'unchanged/newer': { modtime: 4, size: 4 },
          'unchanged/deleted': { modtime: 4, size: 4 },
          'unchanged/older': { modtime: 4, size: 4 },
          'unchanged/unchanged': { modtime: 4, size: 4 },
        };
      },
    };
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            'new/new/different': { modtime: 4, size: 3 },
            'new/new/same': { modtime: 4, size: 3 },
            'new/noexist': { modtime: 43, size: 3 },
            'newer/newer/different': { modtime: 6, size: 3 },
            'newer/newer/same': { modtime: 5, size: 3 },
            'newer/deleted': { modtime: 6, size: 3 },
            'newer/older': { modtime: 6, size: 3 },
            'newer/unchanged': { modtime: 5, size: 3 },
            'older/newer': { modtime: 3, size: 3 },
            'older/deleted': { modtime: 3, size: 3 },
            'older/older/same': { modtime: 3, size: 3 },
            'older/older/different': { modtime: 3, size: 3 },
            'older/unchanged': { modtime: 3, size: 3 },
            'unchanged/newer': { modtime: 4, size: 3 },
            'unchanged/deleted': { modtime: 4, size: 3 },
            'unchanged/older': { modtime: 4, size: 3 },
            'unchanged/unchanged': { modtime: 4, size: 3 },
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
            'new/new/different': { modtime: 5, size: 1 },
            'new/new/same': { modtime: 4, size: 1 },
            'newer/newer/different': { modtime: 5, size: 1 },
            'newer/newer/same': { modtime: 5, size: 1 },
            'newer/older': { modtime: 4, size: 1 },
            'newer/unchanged': { modtime: 4, size: 1 },
            'deleted/newer': { modtime: 5, size: 1 },
            'deleted/older': { modtime: 3, size: 1 },
            'deleted/unchanged': { modtime: 4, size: 1 },
            'older/newer': { modtime: 5, size: 1 },
            'older/older/same': { modtime: 3, size: 1 },
            'older/older/different': { modtime: 2, size: 1 },
            'older/unchanged': { modtime: 4, size: 1 },
            'unchanged/newer': { modtime: 5, size: 1 },
            'unchanged/older': { modtime: 3, size: 1 },
            'unchanged/unchanged': { modtime: 4, size: 1 },
            'noexist/new': { modtime: 4, size: 1 },
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
    expect(spyRemoteDelete).toBeCalledWith('deleted/unchanged');

    expect(spyRemoteDeleteFolder).toBeCalledWith('deleted');
    expect(spyLocalDeleteFolder).not.toBeCalled();

    expect(smokeTestingCB).toBeCalledTimes(1);
    expect(checkingLastRunCB).toBeCalledTimes(1);
    expect(needResyncCB).toBeCalledTimes(0);
    expect(generatingActionsCB).toBeCalledTimes(1);

    const expectedPulls = expectPullLocal.length + expectPullRemote.length;
    expect(pullingFileCB).toBeCalledTimes(expectedPulls);
    expect(pulledFileCB).toBeCalledTimes(expectedPulls);

    expect(deletingFileCB).toBeCalledTimes(2);
    expect(deletedFileCB).toBeCalledTimes(2);

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
    const sync = dummySync();

    const savedListing = {
      unchanged: { modtime: 44, size: 1 },
      newer: { modtime: 44, size: 1 },
      older: { modtime: 44, size: 1 },
      deleted: { modtime: 44, size: 1 },
    };

    const currentListing = {
      unchanged: { modtime: 44, size: 1 },
      newer: { modtime: 45, size: 1 },
      older: { modtime: 43, size: 1 },
      new: { modtime: 44, size: 1 },
    };

    const deltas = sync.generateDeltas(savedListing, currentListing);

    expect(deltas.unchanged).toBe('UNCHANGED');
    expect(deltas.newer).toBe('NEWER');
    expect(deltas.older).toBe('OLDER');
    expect(deltas.deleted).toBe('DELETED');
    expect(deltas.new).toBe('NEW');
  });

  it('should generate action queues correctly', () => {
    const sync = dummySync();

    const localListing: Listing = {
      a: { modtime: 2, size: 1 },
      aa: { modtime: 2, size: 1 },
      b: { modtime: 2, size: 1 },

      c: { modtime: 1, size: 1 },
      cc: { modtime: 2, size: 1 },
      d: { modtime: 2, size: 1 },
      e: { modtime: 2, size: 1 },
      f: { modtime: 2, size: 1 },

      k: { modtime: 2, size: 1 },
      m: { modtime: 2, size: 1 },
      n: { modtime: 1, size: 1 },
      nn: { modtime: 2, size: 1 },
      l: { modtime: 2, size: 1 },

      o: { modtime: 2, size: 1 },
      p: { modtime: 2, size: 1 },
      q: { modtime: 2, size: 1 },
      r: { modtime: 2, size: 1 },
    };

    const remoteListing: Listing = {
      a: { modtime: 1, size: 1 },
      aa: { modtime: 2, size: 1 },
      b: { modtime: 2, size: 1 },

      c: { modtime: 2, size: 1 },
      cc: { modtime: 2, size: 1 },
      e: { modtime: 1, size: 1 },
      f: { modtime: 2, size: 1 },

      g: { modtime: 2, size: 1 },
      h: { modtime: 2, size: 1 },
      i: { modtime: 2, size: 1 },
      j: { modtime: 2, size: 1 },

      k: { modtime: 3, size: 1 },
      n: { modtime: 2, size: 1 },
      nn: { modtime: 2, size: 1 },
      l: { modtime: 2, size: 1 },

      o: { modtime: 2, size: 1 },
      q: { modtime: 2, size: 1 },
      r: { modtime: 2, size: 1 },
    };

    const deltasLocal: Deltas = {
      a: 'NEW',
      aa: 'NEW',
      b: 'NEW',

      c: 'NEWER',
      cc: 'NEWER',
      d: 'NEWER',
      e: 'NEWER',
      f: 'NEWER',

      g: 'DELETED',
      i: 'DELETED',
      j: 'DELETED',

      k: 'OLDER',
      m: 'OLDER',
      n: 'OLDER',
      nn: 'OLDER',
      l: 'OLDER',

      o: 'UNCHANGED',
      p: 'UNCHANGED',
      q: 'UNCHANGED',
      r: 'UNCHANGED',
    };

    const deltasRemote: Deltas = {
      a: 'NEW',
      aa: 'NEW',

      c: 'NEWER',
      cc: 'NEWER',
      d: 'DELETED',
      e: 'OLDER',
      f: 'UNCHANGED',

      g: 'NEWER',
      h: 'DELETED',
      i: 'OLDER',
      j: 'UNCHANGED',

      k: 'NEWER',
      m: 'DELETED',
      n: 'OLDER',
      nn: 'OLDER',
      l: 'UNCHANGED',

      o: 'NEWER',
      p: 'DELETED',
      q: 'OLDER',
      r: 'UNCHANGED',

      s: 'NEW',
    };

    const { pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote } =
      sync.generateActionQueues(
        deltasLocal,
        deltasRemote,
        localListing,
        remoteListing
      );

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
      a: { modtime: 4, size: 1 },
      b: { modtime: 4, size: 1 },
      'c/d': { modtime: 5, size: 1 },
      'c/e': { modtime: 6, size: 1 },
      'c/f': { modtime: 7, size: 1 },
      'd/a': { modtime: 2, size: 1 },
      'd/b': { modtime: 2, size: 1 },
      'e/a': { modtime: 1, size: 1 },
      'e/b': { modtime: 2, size: 1 },
      'nested/quite/a': { modtime: 1, size: 1 },
      'nested/quite/b': { modtime: 1, size: 1 },
      'nested/dontDisapear/a': { modtime: 1, size: 1 },
      'nested/dontDisapear/b': { modtime: 1, size: 1 },
      'disapear/but/returnfalse': { modtime: 2, size: 1 },
    };

    const currentListing: Listing = {
      a: { modtime: 4, size: 1 },
      'c/d': { modtime: 5, size: 1 },
      'c/e': { modtime: 6, size: 1 },
      'c/f': { modtime: 7, size: 1 },
      'd/a': { modtime: 2, size: 1 },
      'nested/dontDisapear/a': { modtime: 1, size: 1 },
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
      imsync: { modtime: 4, size: 5 },
      imnotinremote: { modtime: 4, size: 5 },
      imindiffmodtimes: { modtime: 4, size: 5 },
    };

    const remote: Listing = {
      imsync: { modtime: 4, size: 5 },
      imnotinlocal: { modtime: 4, size: 5 },
      imindiffmodtimes: { modtime: 8, size: 5 },
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
    expect(diff.filesInSync.imsync).toMatchObject({ modtime: 4, size: 5 });
  });
});
