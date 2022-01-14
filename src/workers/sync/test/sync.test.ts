/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-empty-function */
import { Readable } from 'stream';
import Sync, {
  Deltas,
  ErrorDetails,
  FileSystem,
  Listing,
  ListingStore,
  SyncFatalError,
} from '../sync';

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
      return { modTime: 4, size: 4, stream: {} as Readable };
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
    const doneCB = jest.fn();

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
    sync.on('DONE', doneCB);

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
      doneCB,
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
            notExistInRemote: 40,
            existInBothButIsTheSame: 30,
            'folder/nested/existInBoth.txt': 44,
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
            notExistInLocal: 40,
            existInBothButIsTheSame: 30,
            'folder/nested/existInBoth.txt': 55,
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
      doneCB,
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
    expect(doneCB).toBeCalledTimes(1);
  });

  it('should do a default run correctly', async () => {
    const listingStoreMocked: ListingStore = {
      ...listingStore(),
      async getLastSavedListing() {
        return {
          'newer/newer/different': 4,
          'newer/newer/same': 4,
          'newer/deleted': 5,
          'newer/older': 5,
          'newer/unchanged': 4,
          'deleted/newer': 4,
          'deleted/deleted': 4,
          'deleted/older': 4,
          'deleted/unchanged': 4,
          'older/newer': 4,
          'older/deleted': 4,
          'older/older/same': 4,
          'older/older/different': 4,
          'older/unchanged': 4,
          'unchanged/newer': 4,
          'unchanged/deleted': 4,
          'unchanged/older': 4,
          'unchanged/unchanged': 4,
        };
      },
    };
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            'new/new/different': 4,
            'new/new/same': 4,
            'new/noexist': 43,
            'newer/newer/different': 6,
            'newer/newer/same': 5,
            'newer/deleted': 6,
            'newer/older': 6,
            'newer/unchanged': 5,
            'older/newer': 3,
            'older/deleted': 3,
            'older/older/same': 3,
            'older/older/different': 3,
            'older/unchanged': 3,
            'unchanged/newer': 4,
            'unchanged/deleted': 4,
            'unchanged/older': 4,
            'unchanged/unchanged': 4,
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
            'new/new/different': 5,
            'new/new/same': 4,
            'newer/newer/different': 5,
            'newer/newer/same': 5,
            'newer/older': 4,
            'newer/unchanged': 4,
            'deleted/newer': 5,
            'deleted/older': 3,
            'deleted/unchanged': 4,
            'older/newer': 5,
            'older/older/same': 3,
            'older/older/different': 2,
            'older/unchanged': 4,
            'unchanged/newer': 5,
            'unchanged/older': 3,
            'unchanged/unchanged': 4,
            'noexist/new': 4,
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
      doneCB,
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
    expect(doneCB).toBeCalledTimes(1);
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
      unchanged: 44,
      newer: 44,
      older: 44,
      deleted: 44,
    };

    const currentListing = {
      unchanged: 44,
      newer: 45,
      older: 43,
      new: 44,
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
      a: 2,
      aa: 2,
      b: 2,

      c: 1,
      cc: 2,
      d: 2,
      e: 2,
      f: 2,

      k: 2,
      m: 2,
      n: 1,
      nn: 2,
      l: 2,

      o: 2,
      p: 2,
      q: 2,
      r: 2,
    };

    const remoteListing: Listing = {
      a: 1,
      aa: 2,
      b: 2,

      c: 2,
      cc: 2,
      e: 1,
      f: 2,

      g: 2,
      h: 2,
      i: 2,
      j: 2,

      k: 3,
      n: 2,
      nn: 2,
      l: 2,

      o: 2,
      q: 2,
      r: 2,
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
      a: 4,
      b: 4,
      'c/d': 5,
      'c/e': 6,
      'c/f': 7,
      'd/a': 2,
      'd/b': 2,
      'e/a': 1,
      'e/b': 2,
      'nested/quite/a': 1,
      'nested/quite/b': 1,
      'nested/dontDisapear/a': 1,
      'nested/dontDisapear/b': 1,
      'disapear/but/returnfalse': 2,
    };

    const currentListing: Listing = {
      a: 4,
      'c/d': 5,
      'c/e': 6,
      'c/f': 7,
      'd/a': 2,
      'nested/dontDisapear/a': 1,
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
      throw new SyncFatalError('NO_INTERNET', {} as ErrorDetails);
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
});
