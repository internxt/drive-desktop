/* eslint-disable jest/no-conditional-expect */
/* eslint-disable @typescript-eslint/no-empty-function */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Readable } from 'stream';
import { FileSystem } from '../../types';
import Backups from '../backups';

describe('backups tests', () => {
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
        additionalStream: {} as Readable,
      };
    },
    async smokeTest() {},
  });

  function setupEventSpies(backups: Backups) {
    const smokeTestingCB = jest.fn();
    const generatingActionsCB = jest.fn();
    const pullingFileCB = jest.fn();
    const pulledFileCB = jest.fn();
    const deletingFileCB = jest.fn();
    const deletedFileCB = jest.fn();
    const deletingFolderCB = jest.fn();
    const deletedFolderCB = jest.fn();
    const renamingFileCB = jest.fn();
    const renamedFileCB = jest.fn();

    backups.on('SMOKE_TESTING', smokeTestingCB);
    backups.on('GENERATING_ACTIONS_NEEDED_TO_SYNC', generatingActionsCB);
    backups.on('PULLING_FILE', pullingFileCB);
    backups.on('FILE_PULLED', pulledFileCB);
    backups.on('DELETING_FILE', deletingFileCB);
    backups.on('FILE_DELETED', deletedFileCB);
    backups.on('DELETING_FOLDER', deletingFolderCB);
    backups.on('FOLDER_DELETED', deletedFolderCB);
    backups.on('RENAMING_FILE', renamingFileCB);
    backups.on('FILE_RENAMED', renamedFileCB);

    return {
      smokeTestingCB,
      generatingActionsCB,
      pullingFileCB,
      pulledFileCB,
      deletingFileCB,
      deletedFileCB,
      deletingFolderCB,
      deletedFolderCB,
      renamingFileCB,
      renamedFileCB,
    };
  }

  function dummyBackups() {
    return new Backups(mockBase(), mockBase());
  }

  it('should run correctly', async () => {
    const local: FileSystem = {
      ...mockBase(),
      async getCurrentListing() {
        return {
          listing: {
            notExistInLocal: { modtime: 40, size: 1 },
            existInBothButIsTheSame: { modtime: 30, size: 1 },
            'folder/nested/existInBoth.txt': { modtime: 44, size: 1 },
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
            notExistInRemote: { modtime: 40, size: 1 },
            existInBothButIsTheSame: { modtime: 30, size: 1 },
            'folder/nested/existInBoth.txt': { modtime: 55, size: 1 },
          },
          readingMetaErrors: [],
        };
      },
    };

    const backups = new Backups(local, remote);

    const {
      smokeTestingCB,
      generatingActionsCB,
      pullingFileCB,
      pulledFileCB,
      deletingFileCB,
      deletedFileCB,
      renamingFileCB,
      renamedFileCB,
    } = setupEventSpies(backups);

    const spyRemotePull = jest.spyOn(remote, 'pullFile');

    const spyRemoteDelete = jest.spyOn(remote, 'deleteFile');

    await backups.run();

    expect(spyRemotePull).toHaveBeenCalledWith(
      'notExistInLocal',
      expect.anything(),
      expect.anything()
    );
    expect(spyRemotePull).toHaveBeenCalledWith(
      'folder/nested/existInBoth.txt',
      expect.anything(),
      expect.anything()
    );

    expect(spyRemoteDelete).toHaveBeenCalledWith('notExistInRemote');

    expect(smokeTestingCB).toBeCalledTimes(1);
    expect(generatingActionsCB).toBeCalledTimes(1);
    expect(pullingFileCB).toBeCalledTimes(2);
    expect(pulledFileCB).toBeCalledTimes(2);
    expect(deletingFileCB).toBeCalledTimes(1);
    expect(deletedFileCB).toBeCalledTimes(1);
    expect(renamingFileCB).toBeCalledTimes(0);
    expect(renamedFileCB).toBeCalledTimes(0);
  });

  it('should emit a fatal error if get current listings fails', async () => {
    expect.assertions(1);

    const fsFailing = mockBase();
    const backups = new Backups(fsFailing, mockBase());

    jest.spyOn(fsFailing, 'getCurrentListing').mockImplementation(async () => {
      throw new Error();
    });

    try {
      await backups.run();
    } catch (err) {
      expect(err.name).toBe('CANNOT_GET_CURRENT_LISTINGS');
    }
  });
});
