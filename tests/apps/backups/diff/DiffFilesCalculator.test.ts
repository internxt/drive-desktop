import { DiffFilesCalculator } from '../../../../src/apps/backups/diff/DiffFilesCalculator';
import { RemoteTreeMother } from '../../../context/virtual-drive/tree/domain/RemoteTreeMother';
import { LocalTreeMother } from '../../../context/local/tree/domain/LocalTreeMother';
import { DateMother } from '../../../context/shared/domain/DateMother';
import { LocalFileMother } from '../../../context/local/localFile/domain/LocalFileMother';
import path from 'path';
import { AbsolutePath } from '../../../../src/context/local/localFile/infrastructure/AbsolutePath';

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
    expect(Array.from(modified.keys())).toStrictEqual(local.files);
    expect(Array.from(modified.values())).toStrictEqual(remote.files);
  });
});
