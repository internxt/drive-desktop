import { DiffFilesCalculatorService } from './DiffFilesCalculatorService';
import { RemoteTreeMother } from '../../../context/virtual-drive/remoteTree/domain/__test-helpers__/RemoteTreeMother';
import { LocalTreeMother } from '../../../context/local/localTree/domain/__test-helpers__/LocalTreeMother';
import { DateMother } from '../../../context/shared/domain/__test-helpers__/DateMother';
import { LocalFileMother } from '../../../context/local/localFile/domain/__test-helpers__/LocalFileMother';
import path, { relative } from 'node:path';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePathMother } from '../../../context/shared/infrastructure/__test-helpers__/AbsolutePathMother';
import { FileMother } from '../../../context/virtual-drive/files/domain/__test-helpers__/FileMother';
import configStore from '../../main/config';
import { FileNameMother } from '../../../context/shared/domain/__test-helpers__/FileNameMother';
import { FolderMother } from '../../../context/virtual-drive/folders/domain/__test-helpers__/FolderMother';
import { FolderNameMother } from '../../../context/shared/domain/__test-helpers__/FolderNameMother';
import { vi, Mock } from 'vitest';

vi.mock('../../main/config', () => ({
  default: {
    get: vi.fn(),
  },
}));

function generateLocalFiles(count: number) {
  return Array.from({ length: count }, () =>
    LocalFileMother.fromPartial({
      path: AbsolutePathMother.anyFile(),
      modificationTime: DateMother.today().getTime(),
    }),
  );
}

describe('DiffFilesCalculatorService', () => {
  it('groups the remote files as deleted when there are not in the local tree', () => {
    const local = LocalTreeMother.onlyRoot();
    const expectedNumberOfFilesToDelete = 50;
    const remote = RemoteTreeMother.oneLevel(expectedNumberOfFilesToDelete);

    const { deleted } = DiffFilesCalculatorService.calculate(local, remote);

    expect(deleted).toStrictEqual(remote.files);
    expect(deleted.length).toBe(expectedNumberOfFilesToDelete);
  });

  it('groups the local files as added when there are not in the remote tree', () => {
    const expectedNumberOfFilesToAdd = 50;
    const local = LocalTreeMother.oneLevel(expectedNumberOfFilesToAdd);
    const remote = RemoteTreeMother.onlyRoot();

    const { added } = DiffFilesCalculatorService.calculate(local, remote);

    expect(added.length).toBe(expectedNumberOfFilesToAdd);
    expect(added).toStrictEqual(local.files);
  });

  it('groups the local and remote files as modified when the modification time does not match', () => {
    const expectedNumberOfFilesToModify = 1;

    const remote = RemoteTreeMother.oneLevel(expectedNumberOfFilesToModify);
    const local = LocalTreeMother.onlyRoot();

    remote.files.forEach((file) =>
      local.addFile(
        local.root,
        LocalFileMother.fromPartial({
          path: path.join(local.root.path, file.path) as AbsolutePath,
          modificationTime: DateMother.nextDay(new Date(file.updatedAt)).getTime(),
        }),
      ),
    );

    const { modified } = DiffFilesCalculatorService.calculate(local, remote);

    expect(modified.size).toBe(expectedNumberOfFilesToModify);
  });

  it('identifies unmodified files correctly', () => {
    const expectedNumberOfUnmodifiedFiles = 10;
    const local = LocalTreeMother.oneLevel(expectedNumberOfUnmodifiedFiles);
    const remote = RemoteTreeMother.cloneFromLocal(local);

    const { unmodified, added, deleted, modified } = DiffFilesCalculatorService.calculate(local, remote);

    expect(unmodified.length).toBe(expectedNumberOfUnmodifiedFiles);
    expect(added.length).toBe(0);
    expect(deleted.length).toBe(0);
    expect(modified.size).toBe(0);
  });

  it('handles mixed additions, deletions, modifications, and unmodified files', () => {
    const expectedNumberOfFilesToAdd = 5;
    const expectedNumberOfFilesToDelete = 5;
    const local = LocalTreeMother.oneLevel(10);
    const remote = RemoteTreeMother.cloneFromLocal(local);

    const newFiles = generateLocalFiles(expectedNumberOfFilesToAdd);
    local.files.push(...newFiles);
    newFiles.forEach((file) => local.addFile(local.root, file));

    const modifiedRemote = RemoteTreeMother.onlyRoot();

    local.files.forEach((file, index) => {
      if (index < 3) {
        modifiedRemote.addFile(
          modifiedRemote.root,
          FileMother.fromPartial({
            path: path.join(modifiedRemote.root.path, relative(local.root.path, file.path)),
            modificationTime: DateMother.previousDay(new Date(file.modificationTime)).toISOString(),
          }),
        );
      } else {
        modifiedRemote.addFile(
          modifiedRemote.root,
          FileMother.fromPartial({
            path: path.join(remote.root.path, relative(local.root.path, file.path)),
          }),
        );
      }
    });

    const { added, deleted, modified, unmodified } = DiffFilesCalculatorService.calculate(local, modifiedRemote);

    expect(added.length).toBe(expectedNumberOfFilesToAdd);
    expect(deleted.length).toBe(expectedNumberOfFilesToDelete);
    expect(modified.size).toBe(0);
    expect(unmodified.length).toBe(10);
  });

  it('should add the dangling files to the result only if the files are properly dangled files', () => {
    // @ts-ignore
    (configStore.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'storageMigrationDate') return '2025-02-19T00:00:00Z';
      if (key === 'fixDeploymentDate') return '2025-03-01T00:00:00Z';
    });
    const tree = RemoteTreeMother.onlyRoot();
    // We will create 2 files: One dangled and one not dangled
    for (let i = 0; i < 2; i++) {
      tree.addFile(
        tree.root,
        FileMother.fromPartial({
          path: path.join(tree.root.path, FileNameMother.any()),
          createdAt: i === 0 ? new Date('2025-02-20T00:00:00Z').toISOString() : new Date().toISOString(),
        }),
      );
      tree.addFolder(
        tree.root,
        FolderMother.fromPartial({
          path: path.join(tree.root.path, FolderNameMother.any()),
        }),
      );
    }

    const remote = tree;
    const local = LocalTreeMother.onlyRoot();

    // make the local tree have the same files as the remote tree
    remote.files.forEach((file) => {
      const localFile = LocalFileMother.fromPartial({
        path: path.join(local.root.path, file.path) as AbsolutePath,
        modificationTime: DateMother.nextDay(new Date(file.updatedAt)).getTime(),
      });
      local.addFile(local.root, localFile);
    });

    const result = DiffFilesCalculatorService.calculate(local, remote);

    expect(result.added.length).toBe(0);
    expect(result.modified.size).toBe(1);
    expect(result.deleted.length).toBe(0);
    expect(result.unmodified.length).toBe(0);
    expect(result.dangling.size).toBe(1);
    expect(result.total).toBe(1);
  });
  describe('isDangledFile', () => {
    beforeEach(() => {
      (configStore.get as Mock).mockReset();
    });

    it('should return true when the file is dangled', () => {
      // @ts-ignore
      (configStore.get as Mock).mockImplementation((key: string) => {
        if (key === 'storageMigrationDate') return '2025-02-19T12:00:00Z';
        if (key === 'fixDeploymentDate') return '2025-03-04T15:30:00Z';
      });

      const createdAt = new Date('2025-02-20');
      const result = DiffFilesCalculatorService.isDangledFile(createdAt);
      expect(result).toBe(true);
    });

    it('should return false when the file was created before the migration date', () => {
      // @ts-ignore
      (configStore.get as Mock).mockImplementation((key: string) => {
        if (key === 'storageMigrationDate') return '2025-02-19T12:00:00Z';
        if (key === 'fixDeploymentDate') return '2025-03-04T15:30:00Z';
      });

      const createdAt = new Date('2025-02-18');
      const result = DiffFilesCalculatorService.isDangledFile(createdAt);
      expect(result).toBe(false);
    });

    it('should return false when the file was created after the fix date', () => {
      // @ts-ignore
      (configStore.get as Mock).mockImplementation((key: string) => {
        if (key === 'storageMigrationDate') return '2025-02-19T12:00:00Z';
        if (key === 'fixDeploymentDate') return '2025-03-04T15:30:00Z';
      });

      const createdAt = new Date('2025-03-05');
      const result = DiffFilesCalculatorService.isDangledFile(createdAt);
      expect(result).toBe(false);
    });

    it('should return false when the storageMigrationDate is not found', () => {
      // @ts-ignore
      (configStore.get as Mock).mockImplementation((key: string) => {
        if (key === 'storageMigrationDate') return undefined;
        if (key === 'fixDeploymentDate') return '2025-03-04T15:30:00Z';
      });

      const createdAt = new Date('2025-02-20');
      const result = DiffFilesCalculatorService.isDangledFile(createdAt);
      expect(result).toBe(false);
    });

    it('should return false when the fixDeploymentDate is not found', () => {
      // @ts-ignore
      (configStore.get as Mock).mockImplementation((key: string) => {
        if (key === 'storageMigrationDate') return '2025-02-19T12:00:00Z';
        if (key === 'fixDeploymentDate') return undefined;
      });

      const createdAt = new Date('2025-02-20');
      const result = DiffFilesCalculatorService.isDangledFile(createdAt);
      expect(result).toBe(false);
    });

    it('should return false when both dates are not found', () => {
      // @ts-ignore
      (configStore.get as Mock).mockReturnValue(undefined);

      const createdAt = new Date('2025-02-20');
      const result = DiffFilesCalculatorService.isDangledFile(createdAt);
      expect(result).toBe(false);
    });
  });
});
