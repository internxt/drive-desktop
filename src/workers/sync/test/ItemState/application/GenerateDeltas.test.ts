import { generateDeltas } from '../../../ItemState/application/GenerateDeltas';
import { LocalItemMetaData } from '../../../Listings/domain/LocalItemMetaData';
import { SynchronizedItemMetaData } from '../../../Listings/domain/SynchronizedItemMetaData';
import { LocalItemMetaDataMother } from '../../Listings/domain/LocalItemMetaDataMother';
import { SynchronizedItemMetaDataMother } from '../../Listings/domain/SynchronizedItemMetaDataMother';

describe('Generate Deltas', () => {
  describe('create rename deltas', () => {

    it('when a current file cannot be found the mirror file system by name but can be found by its ids its flagged as the result of a rename', () => {
      const syncrhonized = {
        a: SynchronizedItemMetaData.from({
          modtime: 2,
          size: 100,
          isFolder: false,
          name: 'a',
          id: 76,
          ino: 10,
          dev: 20,
        }),
      };

      const current = {
        'a but renamed': LocalItemMetaData.from({
          modtime: 90,
          size: 100,
          isFolder: false,
          name: 'a but renamed',
          ino: 10,
          dev: 20,
        }),
      };

      const deltas = generateDeltas(syncrhonized, current);

      expect(deltas['a'].is('RENAMED')).toBe(true);
      expect(deltas['a but renamed'].is('RENAME_RESULT')).toBe(true);
    });

    it('when a folder with files in it is renamed, the files are not flagged as renamed', () => {
      const syncrhonized = {
        'folder a': SynchronizedItemMetaDataMother.folder({
          name: 'folder a',
          id: 76,
          ino: 10,
          dev: 20,
        }),
        'folder a/file': SynchronizedItemMetaDataMother.file({
          name: 'folder a/file',
          id: 89,
          ino: 451,
          dev: 20,
        }),
      };

      const current = {
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
      };

      const deltas = generateDeltas(syncrhonized, current);

      expect(deltas['folder a but renamed/file'].is('UNCHANGED')).toBe(true);
      expect(deltas['folder a/file'].is('UNCHANGED')).toBe(true);
    });

    it('when a folder with folders in it is renamed, the sub-folders are not flagged as renamed', () => {
      const syncrhonized = {
        'folder a': SynchronizedItemMetaDataMother.folder({
          name: 'folder a',
          id: 76,
          ino: 10,
          dev: 20,
        }),
        'folder a/folder b': SynchronizedItemMetaDataMother.folder({
          name: 'folder a/folder b',
          id: 89,
          ino: 451,
          dev: 20,
        }),
      };

      const current = {
        'folder a but renamed': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed',
          ino: 10,
          dev: 20,
        }),
        'folder a but renamed/folder b': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed/folder b',
          ino: 451,
          dev: 20,
        }),
      };

      const deltas = generateDeltas(syncrhonized, current);

      expect(deltas['folder a/folder b'].is('UNCHANGED')).toBe(true);
      expect(deltas['folder a but renamed/folder b'].is('UNCHANGED')).toBe(
        true
      );
    });

    it('when a folder with folders in it is renamed, the sub-folders files are not flagged as renamed', () => {
      const syncrhonized = {
        'folder a': SynchronizedItemMetaDataMother.folder({
          name: 'folder a',
          id: 76,
          ino: 10,
          dev: 20,
        }),
        'folder a/folder b': SynchronizedItemMetaDataMother.folder({
          name: 'folder a/folder b',
          id: 89,
          ino: 451,
          dev: 20,
        }),
        'folder a/folder b/file.txt': SynchronizedItemMetaDataMother.file({
          name: 'folder a/folder b/file.txt',
          id: 743,
          ino: 4561,
          dev: 20,
        }),
      };

      const current = {
        'folder a but renamed': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed',
          ino: 10,
          dev: 20,
        }),
        'folder a but renamed/folder b': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed/folder b',
          ino: 451,
          dev: 20,
        }),
        'folder a but renamed/folder b/file.txt': LocalItemMetaDataMother.file({
          name: 'folder a but renamed/folder b/file.txt',
          ino: 4561,
          dev: 20,
        }),
      };

      const deltas = generateDeltas(syncrhonized, current);

      expect(deltas['folder a/folder b/file.txt'].is('UNCHANGED')).toBe(true);
      expect(deltas['folder a but renamed/folder b/file.txt'].is('UNCHANGED')).toBe(
        true
      );
    });

    it('when a folder with 2 levels of subfolders is renamed non of the sub-folders is flagged as renamed', () => {
      const syncrhonized = {
        'folder a': SynchronizedItemMetaDataMother.folder({
          name: 'folder a',
          id: 76,
          ino: 10,
          dev: 20,
        }),
        'folder a/folder b': SynchronizedItemMetaDataMother.folder({
          name: 'folder a/folder b',
          id: 89,
          ino: 451,
          dev: 20,
        }),
        'folder a/folder b/folder c': SynchronizedItemMetaDataMother.folder({
          name: 'folder a/folder b/folder c',
          id: 834,
          ino: 4451,
          dev: 20,
        }),
      };

      const current = {
        'folder a but renamed': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed',
          ino: 10,
          dev: 20,
        }),
        'folder a but renamed/folder b': LocalItemMetaDataMother.folder({
          name: 'folder a but renamed/folder b',
          ino: 451,
          dev: 20,
        }),
        'folder a but renamed/folder b/folder c':
          LocalItemMetaDataMother.folder({
            name: 'folder a but renamed/folder b/folder c',
            ino: 4451,
            dev: 20,
          }),
      };

      const deltas = generateDeltas(syncrhonized, current);

      expect(deltas['folder a/folder b'].is('UNCHANGED')).toBe(true);
      expect(deltas['folder a but renamed/folder b'].is('UNCHANGED')).toBe(
        true
      );
      expect(deltas['folder a/folder b/folder c'].is('UNCHANGED')).toBe(true);
      expect(
        deltas['folder a but renamed/folder b/folder c'].is('UNCHANGED')
      ).toBe(true);
    });
  });
});
