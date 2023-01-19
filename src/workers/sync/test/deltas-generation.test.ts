import Sync, { ListingStore } from '../sync';
import { FileSystem, Listing, LocalListing } from '../../types';
import { Delta, Deltas } from '../Deltas';
import { expectStatus } from './exepects';

type ListingTestData = { saved: LocalListing; current: LocalListing };

describe('deltas generation', () => {
  const generateDeltasWrapper = (saved: Listing, current: Listing): Deltas => {
    const sync = new Sync(
      {} as FileSystem,
      {} as FileSystem,
      {} as ListingStore
    );

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return sync.generateDeltas(saved, current);
  };

  const incompleteLocalListingData: Array<{
    saved: unknown;
    current: unknown;
  }> = [
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
    (listings: { saved: unknown; current: unknown }) => {
      const focerdListing = listings as ListingTestData;

      const deltas = generateDeltasWrapper(
        focerdListing.saved,
        focerdListing.current
      );

      expect(deltas.deleted.status).toBe('DELETED');
      expect(deltas.new.status).toBe('NEW');
    }
  );

  it('generates the correct deltas for the given listings', () => {
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

    const deltas = generateDeltasWrapper(savedListing, currentListing);

    expect(deltas.unchanged.status).toBe('UNCHANGED');
    expect(deltas.newer.status).toBe('NEWER');
    expect(deltas.older.status).toBe('OLDER');
    expect(deltas.deleted.status).toBe('DELETED');
    expect(deltas.new.status).toBe('NEW');
  });

  it('generates rename deltas when a file in a folder is renamed', () => {
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

    const deltas = generateDeltasWrapper(
      lastSavedLocalListing,
      currentSavedLocalListing
    );

    expect(deltas['folder/original_name']).toStrictEqual(
      new Delta('RENAMED', 'FILE', ['folder/new_name', 'NEW_NAME'])
    );
    expect(deltas['folder/new_name']).toStrictEqual(
      new Delta('NEW_NAME', 'FILE', ['folder/original_name', 'RENAMED'])
    );
  });

  it('generates rename deltas for single file rename', () => {
    const saved: LocalListing = {
      deleted: { modtime: 44, size: 1, dev: 6, ino: 2, isFolder: false },
    };

    const current: LocalListing = {
      new: { modtime: 70, size: 1, dev: 6, ino: 2, isFolder: false },
    };

    const deltas = generateDeltasWrapper(saved, current);

    expect(deltas.deleted.status).toBe('RENAMED');
    expect(deltas.new.status).toBe('NEW_NAME');
  });

  it('links the correspondand related field when generating deltas', () => {
    const saved: LocalListing = {
      'old_image_name.png': {
        modtime: 44,
        size: 1,
        dev: 6,
        ino: 2,
        isFolder: false,
      },
      'old_doc_name.doc': {
        modtime: 30,
        size: 1,
        dev: 20,
        ino: 40,
        isFolder: false,
      },
    };

    const current: LocalListing = {
      'new_image_name.png': {
        modtime: 46,
        size: 1,
        dev: 6,
        ino: 2,
        isFolder: false,
      },
      'new_doc_name.doc': {
        modtime: 32,
        size: 1,
        dev: 20,
        ino: 40,
        isFolder: false,
      },
    };

    const deltas = generateDeltasWrapper(saved, current);

    expect(deltas['old_doc_name.doc'].status).toBe('RENAMED');
    expect(deltas['new_doc_name.doc'].status).toBe('NEW_NAME');

    expect(deltas['old_image_name.png'].status).toBe('RENAMED');
    expect(deltas['new_image_name.png'].status).toBe('NEW_NAME');
  });

  it('generates rename deltas for a folder and not for the files it contents', () => {
    const saved = {
      folder: {
        modtime: 1673432981,
        isFolder: true,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'folder/file.txt': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
    };

    const current = {
      'new-folder-name': {
        modtime: 1673432981,
        isFolder: true,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'new-folder-name/file.txt': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
    };

    const deltas = generateDeltasWrapper(saved, current);

    expectStatus(deltas['folder/file.txt'], 'UNCHANGED');
    expectStatus(deltas['new-folder-name/file.txt'], 'UNCHANGED');

    expect(deltas['new-folder-name'].status).toBe('NEW_NAME');
    expect(deltas.folder.status).toBe('RENAMED');
  });

  it('generates rename deltas for a folder and not for the folders it contents', () => {
    const saved = {
      folder: {
        modtime: 1673432981,
        isFolder: true,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'folder/file.txt': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
      'folder/subfolder': {
        modtime: 1672824020,
        isFolder: true,
        size: 2093,
        dev: 4,
        ino: 5,
      },
      'folder/subfolder/file.txt': {
        modtime: 1672824020,
        isFolder: true,
        size: 2093,
        dev: 4,
        ino: 6,
      },
    };

    const current = {
      'new-folder-name': {
        modtime: 1673432981,
        isFolder: true,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'new-folder-name/file.txt': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
      'new-folder-name/subfolder': {
        modtime: 1672824020,
        isFolder: true,
        size: 2093,
        dev: 4,
        ino: 5,
      },
      'new-folder-name/subfolder/file.txt': {
        modtime: 1672824020,
        isFolder: true,
        size: 2093,
        dev: 4,
        ino: 6,
      },
    };

    const deltas = generateDeltasWrapper(saved, current);

    expectStatus(deltas['folder/file.txt'], 'UNCHANGED');
    expectStatus(deltas['new-folder-name/file.txt'], 'UNCHANGED');
    expectStatus(deltas['new-folder-name/subfolder'], 'UNCHANGED');
    expectStatus(deltas['new-folder-name/subfolder/file.txt'], 'UNCHANGED');

    expect(deltas['new-folder-name'].status).toBe('NEW_NAME');
    expect(deltas.folder.status).toBe('RENAMED');
  });

  it('returns rename deltas aswell as the rest of items deltas', () => {
    const saved = {
      'old-file-name': {
        modtime: 1673432981,
        isFolder: false,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'unchanged-file-1': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
      'unchanged-file-2': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 5,
      },
      'unchanged-file-3': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 6,
      },
    };

    const current = {
      'new-file-name': {
        modtime: 1673432981,
        isFolder: false,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'unchanged-file-1': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
      'unchanged-file-2': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 5,
      },
      'unchanged-file-3': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 6,
      },
    };

    const deltas = generateDeltasWrapper(saved, current);

    expect(deltas['unchanged-file-1'].status).toBe('UNCHANGED');
    expect(deltas['unchanged-file-2'].status).toBe('UNCHANGED');
    expect(deltas['unchanged-file-3'].status).toBe('UNCHANGED');
  });

  it('returns rename deltas aswell as the rest of items deltas when a folder is renamed', () => {
    const saved = {
      'old-folder-name': {
        modtime: 1673432981,
        isFolder: true,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'old-folder-name/unchanged-file-1': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
      'old-folder-name/unchanged-file-2': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 5,
      },
      'old-folder-name/unchanged-file-3': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 6,
      },
    };

    const current = {
      'new-folder-name': {
        modtime: 1673432981,
        isFolder: true,
        size: 4096,
        dev: 64770,
        ino: 13844966,
      },
      'new-folder-name/unchanged-file-1': {
        modtime: 1672824000,
        isFolder: false,
        size: 2093,
        dev: 64770,
        ino: 13819698,
      },
      'new-folder-name/unchanged-file-2': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 5,
      },
      'new-folder-name/unchanged-file-3': {
        modtime: 1672824020,
        isFolder: false,
        size: 2093,
        dev: 4,
        ino: 6,
      },
    };

    const deltas = generateDeltasWrapper(saved, current);

    expect(deltas['new-folder-name/unchanged-file-1'].status).toBe('UNCHANGED');
    expect(deltas['new-folder-name/unchanged-file-2'].status).toBe('UNCHANGED');
    expect(deltas['new-folder-name/unchanged-file-3'].status).toBe('UNCHANGED');
  });

  const dataSetNumberOfDeltas: Array<
    ListingTestData & { expectedNumberOfDetlas: number }
  > = [
    {
      saved: {
        'file-name': {
          modtime: 1672824000,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13819698,
        },
      },
      current: {},
      expectedNumberOfDetlas: 1,
    },
    {
      saved: {
        'file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13819698,
        },
      },
      current: {
        'new-file-name': {
          modtime: 3,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13819698,
        },
      },
      expectedNumberOfDetlas: 2,
    },
    {
      saved: {
        'file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 1,
        },
        'unchanged-file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 2,
        },
      },
      current: {
        'new-file-name': {
          modtime: 3,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 1,
        },
        'unchanged-file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 2,
        },
      },
      expectedNumberOfDetlas: 3,
    },
    {
      saved: {
        folder: {
          modtime: 1,
          isFolder: true,
          size: 2093,
          dev: 64770,
          ino: 10,
        },
        'folder/file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 1,
        },
        'unchanged-file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 2,
        },
      },
      current: {
        'new-folder': {
          modtime: 2,
          isFolder: true,
          size: 2093,
          dev: 64770,
          ino: 10,
        },
        'new-folder/file-name': {
          modtime: 2,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 1,
        },
        'unchanged-file-name': {
          modtime: 1,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 2,
        },
      },
      expectedNumberOfDetlas: 5,
    },
  ];

  it.each(dataSetNumberOfDeltas)(
    'returns the a delta for each listing',
    ({ saved, current, expectedNumberOfDetlas }) => {
      const deltas = generateDeltasWrapper(saved, current);

      expect(Object.keys(deltas).length).toBe(expectedNumberOfDetlas);
    }
  );

  describe('rename folder with subfolders', () => {
    it('only updates the renamed folder', () => {
      const saved = {
        'folder U': {
          modtime: 1674120777,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13844981,
        },
        'folder U/Captura de pantalla de 2023-01-03 11-35-39.png': {
          modtime: 1672742139,
          isFolder: false,
          size: 76685,
          dev: 64770,
          ino: 13770821,
        },
        'folder U/file.log': {
          modtime: 1672824000,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13778310,
        },
        'folder U/subfolder B': {
          modtime: 1674120777,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13852678,
        },
        'folder U/subfolder B/r.log': {
          modtime: 1672824000,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13778314,
        },
      };

      const current = {
        'folder O': {
          modtime: 1674120777,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13844981,
        },
        'folder O/Captura de pantalla de 2023-01-03 11-35-39.png': {
          modtime: 1672742139,
          isFolder: false,
          size: 76685,
          dev: 64770,
          ino: 13770821,
        },
        'folder O/file.log': {
          modtime: 1672824000,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13778310,
        },
        'folder O/subfolder B': {
          modtime: 1674120777,
          isFolder: true,
          size: 4096,
          dev: 64770,
          ino: 13852678,
        },
        'folder O/subfolder B/r.log': {
          modtime: 1672824000,
          isFolder: false,
          size: 2093,
          dev: 64770,
          ino: 13778314,
        },
      };

      const deltas = generateDeltasWrapper(saved, current);

      expect(deltas).toBeDefined();

      expectStatus(deltas['folder O'], 'NEW_NAME');
      expectStatus(
        deltas['folder O/Captura de pantalla de 2023-01-03 11-35-39.png'],
        'UNCHANGED'
      );
      expectStatus(deltas['folder O/file.log'], 'UNCHANGED');
      expectStatus(deltas['folder O/subfolder B'], 'UNCHANGED');
      expectStatus(deltas['folder O/subfolder B/r.log'], 'UNCHANGED');
      expectStatus(deltas['folder U'], 'RENAMED');
      expectStatus(
        deltas['folder U/Captura de pantalla de 2023-01-03 11-35-39.png'],
        'UNCHANGED'
      );
      expectStatus(deltas['folder U/file.log'], 'UNCHANGED');
      expectStatus(deltas['folder U/subfolder B'], 'UNCHANGED');
      expectStatus(deltas['folder U/subfolder B/r.log'], 'UNCHANGED');
    });
  });
});
