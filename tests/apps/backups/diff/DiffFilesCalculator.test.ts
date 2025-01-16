import { DiffFilesCalculator } from '../../../../src/apps/backups/diff/DiffFilesCalculator';
import { RemoteTreeMother } from '../../../context/virtual-drive/tree/domain/RemoteTreeMother';
import { LocalTreeMother } from '../../../context/local/tree/domain/LocalTreeMother';
import { DateMother } from '../../../context/shared/domain/DateMother';
import { LocalFileMother } from '../../../context/local/localFile/domain/LocalFileMother';
import path from 'path';
import { AbsolutePath } from '../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import { LocalTree } from '../../../../src/context/local/localTree/domain/LocalTree';
import { AbsolutePathMother } from '../../../context/shared/infrastructure/AbsolutePathMother';

describe('DiffFilesCalculator', () => {
  it('groups the remote files as deleted when there are not in the local tree', () => {
    const local = LocalTreeMother.onlyRoot();
    const expectedNumberOfFilesToDelete = 50;
    const remote = RemoteTreeMother.oneLevel(expectedNumberOfFilesToDelete);

    const { deleted } = DiffFilesCalculator.calculate(local, remote);

    expect(deleted).toStrictEqual(remote.files);
    expect(deleted.length).toBe(expectedNumberOfFilesToDelete);
  });

  it('groups the local files as added when there are not in the remote tree', () => {
    const expectedNumberOfFilesToAdd = 50;
    const local = LocalTreeMother.oneLevel(expectedNumberOfFilesToAdd);
    const remote = RemoteTreeMother.onlyRoot();

    const { added } = DiffFilesCalculator.calculate(local, remote);

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
          modificationTime: DateMother.nextDay(
            new Date(file.updatedAt)
          ).getTime(),
        })
      )
    );

    const { modified } = DiffFilesCalculator.calculate(local, remote);

    expect(modified.size).toBe(expectedNumberOfFilesToModify);
    remote.files.forEach((file) => {
      const localFile = local.files.find((f) => f.path === file.path);
      expect(localFile).toBeDefined();
      if (localFile) {
        expect(modified.has(localFile)).toBe(true);
        expect(modified.get(localFile)).toBe(file);
      }
    });
  });

  it('identifies unmodified files correctly', () => {
    const local = LocalTreeMother.oneLevel(10);
    const remote = RemoteTreeMother.oneLevel(10);

    // Create a new LocalTree with the updated files
    const updatedLocal = new LocalTree(local.root);

    const { unmodified, added, deleted, modified } =
      DiffFilesCalculator.calculate(updatedLocal, remote);

    expect(unmodified.length).toBe(10);
    expect(added.length).toBe(0);
    expect(deleted.length).toBe(0);
    expect(modified.size).toBe(0);
  });

  it('handles mixed additions, deletions, modifications, and unmodified files', () => {
    const local = LocalTreeMother.oneLevel(15);
    const remote = RemoteTreeMother.oneLevel(10);

    // Add 5 new files to local
    for (let i = 11; i <= 15; i++) {
      local.addFile(
        local.root,
        LocalFileMother.fromPartial({
          path: AbsolutePathMother.anyFile(),
          modificationTime: DateMother.today().getTime(),
        })
      );
    }

    const updatedLocal = new LocalTree(local.root);

    // Modify some files in remote
    for (let i = 0; i < 3; i++) {
      remote.files[i].updatedAt = DateMother.nextDay(new Date());
    }

    const { added, deleted, modified, unmodified } =
      DiffFilesCalculator.calculate(updatedLocal, remote);

    expect(added.length).toBe(5);
    expect(deleted.length).toBe(0); // Since remote only has 10 and local has 15
    expect(modified.size).toBe(3);
    expect(unmodified.length).toBe(7);
  });
});
