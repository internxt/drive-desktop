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
  LocalListingData,
  ProcessFatalError,
} from '../../types';
import { Delta } from '../Deltas';

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
          'newer/newer/different': { modtime: 4, size: 4, isFolder: false },
          'newer/newer/same': { modtime: 4, size: 4, isFolder: false },
          'newer/deleted': { modtime: 5, size: 4, isFolder: false },
          'newer/older': { modtime: 5, size: 4, isFolder: false },
          'newer/unchanged': { modtime: 4, size: 4, isFolder: false },
          'deleted/newer': { modtime: 4, size: 4, isFolder: false },
          'deleted/deleted': { modtime: 4, size: 4, isFolder: false },
          'deleted/older': { modtime: 4, size: 4, isFolder: false },
          'deleted/unchanged': { modtime: 4, size: 4, isFolder: false },
          'older/newer': { modtime: 4, size: 4, isFolder: false },
          'older/deleted': { modtime: 4, size: 4, isFolder: false },
          'older/older/same': { modtime: 4, size: 4, isFolder: false },
          'older/older/different': { modtime: 4, size: 4, isFolder: false },
          'older/unchanged': { modtime: 4, size: 4, isFolder: false },
          'unchanged/newer': { modtime: 4, size: 4, isFolder: false },
          'unchanged/deleted': { modtime: 4, size: 4, isFolder: false },
          'unchanged/older': { modtime: 4, size: 4, isFolder: false },
          'unchanged/unchanged': { modtime: 4, size: 4, isFolder: false },
        };
      },
    };
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            'new/new/different': { modtime: 4, size: 3, isFolder: false },
            'new/new/same': { modtime: 4, size: 3, isFolder: false },
            'new/noexist': { modtime: 43, size: 3, isFolder: false },
            'newer/newer/different': { modtime: 6, size: 3, isFolder: false },
            'newer/newer/same': { modtime: 5, size: 3, isFolder: false },
            'newer/deleted': { modtime: 6, size: 3, isFolder: false },
            'newer/older': { modtime: 6, size: 3, isFolder: false },
            'newer/unchanged': { modtime: 5, size: 3, isFolder: false },
            'older/newer': { modtime: 3, size: 3, isFolder: false },
            'older/deleted': { modtime: 3, size: 3, isFolder: false },
            'older/older/same': { modtime: 3, size: 3, isFolder: false },
            'older/older/different': { modtime: 3, size: 3, isFolder: false },
            'older/unchanged': { modtime: 3, size: 3, isFolder: false },
            'unchanged/newer': { modtime: 4, size: 3, isFolder: false },
            'unchanged/deleted': { modtime: 4, size: 3, isFolder: false },
            'unchanged/older': { modtime: 4, size: 3, isFolder: false },
            'unchanged/unchanged': { modtime: 4, size: 3, isFolder: false },
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
            'new/new/different': { modtime: 5, size: 1, isFolder: false },
            'new/new/same': { modtime: 4, size: 1, isFolder: false },
            'newer/newer/different': { modtime: 5, size: 1, isFolder: false },
            'newer/newer/same': { modtime: 5, size: 1, isFolder: false },
            'newer/older': { modtime: 4, size: 1, isFolder: false },
            'newer/unchanged': { modtime: 4, size: 1, isFolder: false },
            'deleted/newer': { modtime: 5, size: 1, isFolder: false },
            'deleted/older': { modtime: 3, size: 1, isFolder: false },
            'deleted/unchanged': { modtime: 4, size: 1, isFolder: false },
            'older/newer': { modtime: 5, size: 1, isFolder: false },
            'older/older/same': { modtime: 3, size: 1, isFolder: false },
            'older/older/different': { modtime: 2, size: 1, isFolder: false },
            'older/unchanged': { modtime: 4, size: 1, isFolder: false },
            'unchanged/newer': { modtime: 5, size: 1, isFolder: false },
            'unchanged/older': { modtime: 3, size: 1, isFolder: false },
            'unchanged/unchanged': { modtime: 4, size: 1, isFolder: false },
            'noexist/new': { modtime: 4, size: 1, isFolder: false },
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

  describe('deltas generation', () => {
    const incompleteLocalListingData = [
      {
        saved: {
          deleted: { modtime: 44, size: 1, ino: 2 },
        },
        current: {
          new: { modtime: 70, size: 1, dev: 6, ino: 2 },
        },
      },
      {
        saved: { deleted: { modtime: 44, size: 1, dev: 6, ino: 2 } },
        current: { new: { modtime: 70, size: 1, ino: 2 } },
      },
      {
        saved: { deleted: { modtime: 44, size: 1, dev: 6 } },
        current: { new: { modtime: 70, size: 1, dev: 6, ino: 2 } },
      },
      {
        saved: { deleted: { modtime: 44, size: 1, dev: 6, ino: 2 } },
        current: { new: { modtime: 70, size: 1, dev: 6 } },
      },
      {
        saved: { deleted: { modtime: 44, size: 1 } },
        current: { new: { modtime: 70, size: 1, dev: 6, ino: 2 } },
      },
      {
        saved: { deleted: { modtime: 44, size: 1, dev: 6, ino: 2 } },
        current: { new: { modtime: 70, size: 1 } },
      },
      {
        saved: { deleted: { modtime: 44, size: 1 } },
        current: { new: { modtime: 70, size: 1 } },
      },
    ];

    it.each(incompleteLocalListingData)(
      'does not generate rename actions if cannot determine the changes are a rename',
      (listings) => {
        const sync = dummySync();

        const deltas = sync.generateDeltas(listings.saved, listings.current);

        expect(deltas.deleted.status).toBe('DELETED');
        expect(deltas.new.status).toBe('NEW');
      }
    );

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

      expect(deltas.unchanged.status).toBe('UNCHANGED');
      expect(deltas.newer.status).toBe('NEWER');
      expect(deltas.older.status).toBe('OLDER');
      expect(deltas.deleted.status).toBe('DELETED');
      expect(deltas.new.status).toBe('NEW');
    });

    it('generates rename deltas when a file in a folder is renamed', () => {
      const sync = dummySync();
      const lastSavedLocalListing = {
        folder: {
          modtime: 1,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13852866,
        },
        'folder/original_name': {
          modtime: 2,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13821414,
        },
      };

      const currentSavedLocalListing = {
        folder: {
          modtime: 3,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13852866,
        },
        'folder/new_name': {
          modtime: 3,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13821414,
        },
      };

      const deltas = sync.generateDeltas(
        lastSavedLocalListing,
        currentSavedLocalListing
      );

      expect(deltas['folder/original_name']).toStrictEqual(
        new Delta('RENAMED', 'FILE')
      );
      expect(deltas['folder/new_name']).toStrictEqual(
        new Delta('NEW_NAME', 'FILE')
      );
    });

    it('generates rename deltas for single file rename', () => {
      const sync = dummySync();

      const saved: LocalListing = {
        deleted: { modtime: 44, size: 1, dev: 6, ino: 2 },
      };

      const current: LocalListingData = {
        new: { modtime: 70, size: 1, dev: 6, ino: 2 },
      };

      const deltas = sync.generateDeltas(saved, current);

      expect(deltas.deleted.status).toBe('RENAMED');
      expect(deltas.new.status).toBe('NEW_NAME');
    });
  });

  describe('Queue generation', () => {
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
        a: new Delta('NEW', 'FILE'),
        aa: new Delta('NEW', 'FILE'),
        b: new Delta('NEW', 'FILE'),

        c: new Delta('NEWER', 'FILE'),
        cc: new Delta('NEWER', 'FILE'),
        d: new Delta('NEWER', 'FILE'),
        e: new Delta('NEWER', 'FILE'),
        f: new Delta('NEWER', 'FILE'),

        g: new Delta('DELETED', 'FILE'),
        i: new Delta('DELETED', 'FILE'),
        j: new Delta('DELETED', 'FILE'),

        k: new Delta('OLDER', 'FILE'),
        m: new Delta('OLDER', 'FILE'),
        n: new Delta('OLDER', 'FILE'),
        nn: new Delta('OLDER', 'FILE'),
        l: new Delta('OLDER', 'FILE'),

        o: new Delta('UNCHANGED', 'FILE'),
        p: new Delta('UNCHANGED', 'FILE'),
        q: new Delta('UNCHANGED', 'FILE'),
        r: new Delta('UNCHANGED', 'FILE'),
      };

      const deltasRemote: Deltas = {
        a: new Delta('NEW', 'FILE'),
        aa: new Delta('NEW', 'FILE'),

        c: new Delta('NEWER', 'FILE'),
        cc: new Delta('NEWER', 'FILE'),
        d: new Delta('DELETED', 'FILE'),
        e: new Delta('OLDER', 'FILE'),
        f: new Delta('UNCHANGED', 'FILE'),

        g: new Delta('NEWER', 'FILE'),
        h: new Delta('DELETED', 'FILE'),
        i: new Delta('OLDER', 'FILE'),
        j: new Delta('UNCHANGED', 'FILE'),

        k: new Delta('NEWER', 'FILE'),
        m: new Delta('DELETED', 'FILE'),
        n: new Delta('OLDER', 'FILE'),
        nn: new Delta('OLDER', 'FILE'),
        l: new Delta('UNCHANGED', 'FILE'),

        o: new Delta('NEWER', 'FILE'),
        p: new Delta('DELETED', 'FILE'),
        q: new Delta('OLDER', 'FILE'),
        r: new Delta('UNCHANGED', 'FILE'),

        s: new Delta('NEW', 'FILE'),
      };

      const { pull: pullQueue, delete: deleteQueue } =
        sync.generateActionQueues(
          deltasLocal,
          deltasRemote,
          localListing,
          remoteListing
        );

      expect(pullQueue.get('LOCAL', 'FILE').sort()).toEqual(
        ['c', 'g', 'i', 'n', 'k', 'o', 'q', 's'].sort()
      );
      expect(pullQueue.get('REMOTE', 'FILE').sort()).toEqual(
        ['a', 'b', 'e', 'd', 'f', 'm', 'l'].sort()
      );

      expect(deleteQueue.get('LOCAL', 'FILE')).toEqual(['p']);
      expect(deleteQueue.get('REMOTE', 'FILE')).toEqual(['j']);
    });

    it('generates the rename queue', () => {
      const sync = dummySync();

      const currentLocal = {
        new_root_filename: {
          modtime: 10,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13642307,
        },
      };

      const currentRemote = {
        old_root_filename: {
          modtime: 3,
          size: '2093',
          isFolder: false,
        },
      };

      const localDeltas = {
        new_root_filename: new Delta('NEW_NAME', 'FILE'),
        old_root_filename: new Delta('RENAMED', 'FILE'),
      };

      const remoteDeltas = {
        old_root_filename: new Delta('UNCHANGED', 'FILE'),
      };

      const queues = sync.generateActionQueues(
        localDeltas,
        remoteDeltas,
        currentLocal,
        currentRemote
      );

      expect(queues.rename.get('REMOTE', 'FILE')).toStrictEqual([
        ['old_root_filename', 'new_root_filename'],
      ]);
    });

    it('generates the rename queue when 2 files where renamed', () => {
      const sync = dummySync();

      const currentLocal = {
        new_root_filename: {
          modtime: 10,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13642307,
        },
        folder: {
          modtime: 14,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13852866,
        },
        'folder/new_subfolder_filename': {
          modtime: 15,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13821414,
        },
      };

      const currentRemote = {
        old_root_filename: {
          modtime: 3,
          size: '2093',
          isFolder: false,
        },
        folder: {
          modtime: 1,
          isFolder: true,
          size: 4096,
        },
        'folder/old_subfolder_filename': {
          modtime: 4,
          size: '2093',
          isFolder: false,
        },
      };

      const localDeltas = {
        new_root_filename: new Delta('NEW_NAME', 'FILE'),
        old_root_filename: new Delta('RENAMED', 'FILE'),
        folder: new Delta('NEWER', 'FOLDER'),
        'folder/new_subfolder_filename': new Delta('NEW_NAME', 'FILE'),
        'folder/old_subfolder_filename': new Delta('RENAMED', 'FILE'),
      };

      const remoteDeltas = {
        old_root_filename: new Delta('UNCHANGED', 'FILE'),
        'folder/old_subfolder_filename': new Delta('UNCHANGED', 'FILE'),
        folder: new Delta('UNCHANGED', 'FOLDER'),
      };

      const queues = sync.generateActionQueues(
        localDeltas,
        remoteDeltas,
        currentLocal,
        currentRemote
      );

      expect(queues.areEmpty()).toBe(false);

      expect(queues.rename.get('REMOTE', 'FILE')).toStrictEqual([
        ['old_root_filename', 'new_root_filename'],
      ]);
    });
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
