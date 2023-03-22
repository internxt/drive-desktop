import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { LocalListing, RemoteListing } from '../../../Listings/domain/Listing';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { ItemDeltas } from '../../../ItemState/domain/ItemDelta';
import { ItemState } from '../../../ItemState/domain/ItemState';
import { generateHierarchyActions } from '../../../Actions/application/GenerateHierarchyActions';
import { convertActionsToQueues } from '../../../Actions/application/ConvertActionsToQueues';

describe('actions generation', () => {
  describe('imported old tests', () => {
    it('should generate action queue correctly', () => {
      const localListing: LocalListing = {
        a: LocalItemMetaData.from({
          name: 'a',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 407,
          dev: 8,
        }),
        aa: LocalItemMetaData.from({
          name: 'aa',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 315,
          dev: 8,
        }),
        b: LocalItemMetaData.from({
          name: 'b',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 379,
          dev: 8,
        }),
        c: LocalItemMetaData.from({
          name: 'c',
          modtime: 1,
          size: 1,
          isFolder: false,
          ino: 500,
          dev: 8,
        }),
        cc: LocalItemMetaData.from({
          name: 'cc',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 368,
          dev: 8,
        }),
        d: LocalItemMetaData.from({
          name: 'd',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 878,
          dev: 8,
        }),
        e: LocalItemMetaData.from({
          name: 'e',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 408,
          dev: 8,
        }),
        f: LocalItemMetaData.from({
          name: 'f',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 367,
          dev: 8,
        }),
        k: LocalItemMetaData.from({
          name: 'k',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 855,
          dev: 8,
        }),
        m: LocalItemMetaData.from({
          name: 'm',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 746,
          dev: 8,
        }),
        n: LocalItemMetaData.from({
          name: 'n',
          modtime: 1,
          size: 1,
          isFolder: false,
          ino: 684,
          dev: 8,
        }),
        nn: LocalItemMetaData.from({
          name: 'nn',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 468,
          dev: 8,
        }),
        l: LocalItemMetaData.from({
          name: 'l',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 284,
          dev: 8,
        }),
        o: LocalItemMetaData.from({
          name: 'o',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 441,
          dev: 8,
        }),
        p: LocalItemMetaData.from({
          name: 'p',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 715,
          dev: 8,
        }),
        q: LocalItemMetaData.from({
          name: 'q',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 474,
          dev: 8,
        }),
        r: LocalItemMetaData.from({
          name: 'r',
          modtime: 2,
          size: 1,
          isFolder: false,
          ino: 651,
          dev: 8,
        }),
      };

      const remoteListing: RemoteListing = {
        a: RemoteItemMetaData.from({
          name: 'a',
          modtime: 1,
          size: 1,
          isFolder: false,
          id: 5807,
        }),
        aa: RemoteItemMetaData.from({
          name: 'aa',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 7762,
        }),
        b: RemoteItemMetaData.from({
          name: 'b',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 7311,
        }),
        c: RemoteItemMetaData.from({
          name: 'c',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 9389,
        }),
        cc: RemoteItemMetaData.from({
          name: 'cc',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 3379,
        }),
        e: RemoteItemMetaData.from({
          name: 'e',
          modtime: 1,
          size: 1,
          isFolder: false,
          id: 2168,
        }),
        f: RemoteItemMetaData.from({
          name: 'f',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 3752,
        }),
        g: RemoteItemMetaData.from({
          name: 'g',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 1595,
        }),
        h: RemoteItemMetaData.from({
          name: 'h',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 5232,
        }),
        i: RemoteItemMetaData.from({
          name: 'i',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 4932,
        }),
        j: RemoteItemMetaData.from({
          name: 'j',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 7723,
        }),

        k: RemoteItemMetaData.from({
          name: 'k',
          modtime: 3,
          size: 1,
          isFolder: false,
          id: 5094,
        }),
        n: RemoteItemMetaData.from({
          name: 'n',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 6632,
        }),
        nn: RemoteItemMetaData.from({
          name: 'nn',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 2008,
        }),
        l: RemoteItemMetaData.from({
          name: 'l',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 1718,
        }),

        o: RemoteItemMetaData.from({
          name: 'o',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 8449,
        }),
        q: RemoteItemMetaData.from({
          name: 'q',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 4199,
        }),
        r: RemoteItemMetaData.from({
          name: 'r',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 4689,
        }),

        s: RemoteItemMetaData.from({
          name: 's',
          modtime: 2,
          size: 1,
          isFolder: false,
          id: 4689,
        }),
      };

      const deltasLocal: ItemDeltas = {
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

      const deltasRemote: ItemDeltas = {
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

    it('should generate action queue correctly as folders', () => {
      const localListing: LocalListing = {
        a: LocalItemMetaData.from({
          name: 'a',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 407,
          dev: 8,
        }),
        aa: LocalItemMetaData.from({
          name: 'aa',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 315,
          dev: 8,
        }),
        b: LocalItemMetaData.from({
          name: 'b',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 379,
          dev: 8,
        }),
        c: LocalItemMetaData.from({
          name: 'c',
          modtime: 1,
          size: 1,
          isFolder: true,
          ino: 500,
          dev: 8,
        }),
        cc: LocalItemMetaData.from({
          name: 'cc',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 368,
          dev: 8,
        }),
        d: LocalItemMetaData.from({
          name: 'd',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 878,
          dev: 8,
        }),
        e: LocalItemMetaData.from({
          name: 'e',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 408,
          dev: 8,
        }),
        f: LocalItemMetaData.from({
          name: 'f',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 367,
          dev: 8,
        }),
        k: LocalItemMetaData.from({
          name: 'k',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 855,
          dev: 8,
        }),
        m: LocalItemMetaData.from({
          name: 'm',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 746,
          dev: 8,
        }),
        n: LocalItemMetaData.from({
          name: 'n',
          modtime: 1,
          size: 1,
          isFolder: true,
          ino: 684,
          dev: 8,
        }),
        nn: LocalItemMetaData.from({
          name: 'nn',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 468,
          dev: 8,
        }),
        l: LocalItemMetaData.from({
          name: 'l',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 284,
          dev: 8,
        }),
        o: LocalItemMetaData.from({
          name: 'o',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 441,
          dev: 8,
        }),
        p: LocalItemMetaData.from({
          name: 'p',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 715,
          dev: 8,
        }),
        q: LocalItemMetaData.from({
          name: 'q',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 474,
          dev: 8,
        }),
        r: LocalItemMetaData.from({
          name: 'r',
          modtime: 2,
          size: 1,
          isFolder: true,
          ino: 651,
          dev: 8,
        }),
      };

      const remoteListing: RemoteListing = {
        a: RemoteItemMetaData.from({
          name: 'a',
          modtime: 1,
          size: 1,
          isFolder: true,
          id: 5807,
        }),
        aa: RemoteItemMetaData.from({
          name: 'aa',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 7762,
        }),
        b: RemoteItemMetaData.from({
          name: 'b',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 7311,
        }),
        c: RemoteItemMetaData.from({
          name: 'c',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 9389,
        }),
        cc: RemoteItemMetaData.from({
          name: 'cc',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 3379,
        }),
        e: RemoteItemMetaData.from({
          name: 'e',
          modtime: 1,
          size: 1,
          isFolder: true,
          id: 2168,
        }),
        f: RemoteItemMetaData.from({
          name: 'f',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 3752,
        }),
        g: RemoteItemMetaData.from({
          name: 'g',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 1595,
        }),
        h: RemoteItemMetaData.from({
          name: 'h',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 5232,
        }),
        i: RemoteItemMetaData.from({
          name: 'i',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 4932,
        }),
        j: RemoteItemMetaData.from({
          name: 'j',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 7723,
        }),

        k: RemoteItemMetaData.from({
          name: 'k',
          modtime: 3,
          size: 1,
          isFolder: true,
          id: 5094,
        }),
        n: RemoteItemMetaData.from({
          name: 'n',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 6632,
        }),
        nn: RemoteItemMetaData.from({
          name: 'nn',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 2008,
        }),
        l: RemoteItemMetaData.from({
          name: 'l',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 1718,
        }),

        o: RemoteItemMetaData.from({
          name: 'o',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 8449,
        }),
        q: RemoteItemMetaData.from({
          name: 'q',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 4199,
        }),
        r: RemoteItemMetaData.from({
          name: 'r',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 4689,
        }),

        s: RemoteItemMetaData.from({
          name: 's',
          modtime: 2,
          size: 1,
          isFolder: true,
          id: 4689,
        }),
      };

      const deltasLocal: ItemDeltas = {
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

      const deltasRemote: ItemDeltas = {
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

      const queues = convertActionsToQueues(actions);

      const { pullFromLocal, pullFromRemote, deleteInLocal, deleteInRemote } =
        queues.folder;

      expect(pullFromLocal.sort()).toEqual(
        ['c', 'g', 'i', 'n', 'k', 'o', 'q', 's'].sort()
      );
      expect(pullFromRemote.sort()).toEqual(
        ['a', 'b', 'e', 'd', 'f', 'm', 'l'].sort()
      );

      expect(deleteInLocal).toEqual(['p']);
      expect(deleteInRemote).toEqual(['j']);
    });
  });
});
