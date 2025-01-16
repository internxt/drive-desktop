import { DiffFilesCalculator } from '../../../../src/apps/backups/diff/DiffFilesCalculator';
import { RemoteTreeMother } from '../../../context/virtual-drive/tree/domain/RemoteTreeMother';
import { LocalTreeMother } from '../../../context/local/tree/domain/LocalTreeMother';
import { DateMother } from '../../../context/shared/domain/DateMother';
import { LocalFileMother } from '../../../context/local/localFile/domain/LocalFileMother';
import path, { relative } from 'path';
import { AbsolutePath } from '../../../../src/context/local/localFile/infrastructure/AbsolutePath';
import { AbsolutePathMother } from '../../../context/shared/infrastructure/AbsolutePathMother';
import { FileMother } from '../../../context/virtual-drive/files/domain/FileMother';

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
  });

  it('identifies unmodified files correctly', () => {
    const expectedNumberOfUnmodifiedFiles = 10;
    const local = LocalTreeMother.oneLevel(expectedNumberOfUnmodifiedFiles);
    const remote = RemoteTreeMother.cloneFromLocal(local);

    const { unmodified, added, deleted, modified } =
      DiffFilesCalculator.calculate(local, remote);

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

    for (let i = 0; i < 5; i++) {
      local.addFile(
        local.root,
        LocalFileMother.fromPartial({
          path: AbsolutePathMother.anyFile(),
          modificationTime: DateMother.today().getTime(),
        })
      );
    }

    const modifiedRemote = RemoteTreeMother.onlyRoot();

    local.files.forEach((file, index) => {
      if (index < 3) {
        modifiedRemote.addFile(
          modifiedRemote.root,
          FileMother.fromPartial({
            path: path.join(
              modifiedRemote.root.path,
              relative(local.root.path, file.path)
            ),
            modificationTime: DateMother.previousDay(
              new Date(file.modificationTime)
            ).toISOString(),
          })
        );
      } else {
        modifiedRemote.addFile(
          modifiedRemote.root,
          FileMother.fromPartial({
            path: path.join(
              remote.root.path,
              relative(local.root.path, file.path)
            ),
          })
        );
      }
    });

    const { added, deleted, modified, unmodified } =
      DiffFilesCalculator.calculate(local, modifiedRemote);

    expect(added.length).toBe(expectedNumberOfFilesToAdd);
    expect(deleted.length).toBe(expectedNumberOfFilesToDelete);
    expect(modified.size).toBe(0);
    expect(unmodified.length).toBe(10);
  });
});
