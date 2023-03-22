import { ItemDeltas } from '../../../ItemState/domain/ItemDelta';
import { ItemState } from '../../../ItemState/domain/ItemState';
import {
  Listing,
  LocalListing,
  RemoteListing,
} from 'workers/sync/Listings/domain/Listing';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';
import { generateHierarchyActions } from '../../../Actions/application/GenerateHierarchyActions';
import { generateDeltas } from '../../../ItemState/application/GenerateDeltas';
import { SynchronizedItemMetaData } from '../../../Listings/domain/SynchronizedItemMetaData';
import { LocalItemMetaDataMother } from '../../Listings/domain/LocalItemMetaDataMother';

describe('Generate Hierarchy Actions', () => {
  const SUT = generateHierarchyActions;

  describe('Rename actions from generated Deltas', () => {
    it('generates rename actions for folder', () => {
      const synchronizedListing: Listing = {
        folder: SynchronizedItemMetaData.from({
          name: 'folder',
          modtime: 30,
          size: 10,
          isFolder: true,
          id: 10,
          ino: 500,
          dev: 10,
        }),
      };

      const localListing: LocalListing = {
        'folder a but renamed': LocalItemMetaData.from({
          name: 'folder a but renamed',
          modtime: 30,
          size: 10,
          isFolder: true,
          ino: 500,
          dev: 10,
        }),
      };

      const remoteListing: RemoteListing = {
        folder: RemoteItemMetaData.from({
          name: 'folder',
          modtime: 30,
          size: 10,
          isFolder: true,
          id: 10,
        }),
      };
      const localDeltas = generateDeltas(synchronizedListing, localListing);
      const remoteDeltas = generateDeltas(synchronizedListing, remoteListing);

      const actions = SUT(
        localDeltas,
        remoteDeltas,
        localListing,
        remoteListing
      );

      expect(actions).toHaveLength(1);
      expect(actions[0].task).toBe('RENAME');
    });
  });

  describe('Rename actions', () => {
    it('generates rename actions for folder', () => {
      const local: LocalListing = {
        'folder a but renamed': LocalItemMetaData.from({
          name: 'folder a but renamed',
          modtime: 30,
          size: 10,
          isFolder: true,
          ino: 500,
          dev: 10,
        }),
      };

      const remote: RemoteListing = {
        folder: RemoteItemMetaData.from({
          name: 'folder',
          modtime: 30,
          size: 10,
          isFolder: true,
          id: 10,
        }),
      };

      const deltasLocal: ItemDeltas = {
        'folder a': new ItemState('RENAMED'),
        'folder a but renamed': new ItemState('RENAME_RESULT'),
      };

      const deltaRemote: ItemDeltas = {
        'folder a': new ItemState('UNCHANGED'),
      };

      const actions = SUT(deltasLocal, deltaRemote, local, remote);

      expect(actions).toHaveLength(1);
      expect(actions[0].task).toBe('RENAME');
    });

    it('generates a single rename action for a folder but any for its conents', () => {

      const syncrhonized = {
        'folder a': SynchronizedItemMetaData.from({
          modtime: 2,
          size: 100,
          isFolder: true,
          name: 'folder a',
          id: 76,
          ino: 10,
          dev: 20,
        }),
        'folder a/file': SynchronizedItemMetaData.from({
          name: 'folder a/file',
          modtime: 2,
          isFolder: false,
          size: 100,
          id: 89,
          ino: 451,
          dev: 20,
        }),
        'folder a/folder b': SynchronizedItemMetaData.from({
          modtime: 2,
          size: 2,
          name: 'folder a/folder b',
          isFolder: true,
          id: 354,
          ino: 1,
          dev: 20,
        }),
        'folder a/folder b/folder c': SynchronizedItemMetaData.from({
          modtime: 2,
          size: 2,
          name: 'folder a/folder b/folder c',
          isFolder: true,
          id: 834,
          ino: 4451,
          dev: 20,
        }),
        'folder a/folder b/folder c/file d.txt': SynchronizedItemMetaData.from({
          modtime: 2,
          size: 2,
          name: 'folder a/folder b/folder c/file d.txt',
          isFolder: false,
          id: 634,
          ino: 500,
          dev: 20,
        }),
      };

      const currentLocal = {
        'folder a but renamed': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed',
          ino: 10,
          dev: 20,
        }),
        'folder a but renamed/file': LocalItemMetaDataMother.file({
          name: 'folder a but renamed/file',
          ino: 451,
          dev: 20,
        }),
        'folder a but renamed/folder b': LocalItemMetaData.from({
          modtime: 100,
          size: 2,
          name: 'folder a but renamed/folder b',
          isFolder: true,
          ino: 1,
          dev: 20,
        }),
        'folder a but renamed/folder b/folder c': LocalItemMetaData.from({
          modtime: 200,
          size: 2,
          name: 'folder a but renamed/folder b/folder c',
          isFolder: true,
          ino: 4451,
          dev: 20,
        }),
        'folder a but renamed/folder b/folder c/file d.txt':
          LocalItemMetaData.from({
            modtime: 200,
            size: 2,
            name: 'folder a but renamed/folder b/folder c/file d.txt',
            isFolder: false,
            ino: 500,
            dev: 20,
          }),
      };

      const currentRemote = {
        'folder a': RemoteItemMetaData.from({
          modtime: 2,
          size: 100,
          isFolder: true,
          name: 'folder a',
          id: 76,
        }),
        'folder a/file': RemoteItemMetaData.from({
          name: 'folder a/file',
          modtime: 2,
          isFolder: false,
          size: 100,
          id: 89,
        }),
        'folder a/folder b': RemoteItemMetaData.from({
          modtime: 2,
          size: 2,
          name: 'folder a/folder b',
          isFolder: true,
          id: 354,
        }),
        'folder a/folder b/folder c': RemoteItemMetaData.from({
          modtime: 2,
          size: 2,
          name: 'folder a/folder b/folder c',
          isFolder: true,
          id: 834,
        }),
        'folder a/folder b/folder c/file d.txt': RemoteItemMetaData.from({
          modtime: 2,
          size: 2,
          name: 'folder a/folder b/folder c/file d.txt',
          isFolder: false,
          id: 634,
        }),
      };

      const localDeltas = generateDeltas(syncrhonized, currentLocal);
      const remoteDeltas = generateDeltas(syncrhonized, currentRemote);

      const actions = SUT(
        localDeltas,
        remoteDeltas,
        currentLocal,
        currentRemote
      );

      expect(actions).toHaveLength(1);
      expect(actions[0].task).toBe('RENAME');
    });
  });
});
