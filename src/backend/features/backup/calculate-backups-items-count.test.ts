import { calculateBackupsItemsCount } from './calculate-backups-items-count';
import { BackupInfo } from '../../../apps/backups/BackupInfo';
import { Container } from 'diod';
import * as precalculateBackupItemCountModule from './precalculate-backup-item-count';
import { partialSpyOn } from 'tests/vitest/utils.helper';
import { loggerMock } from 'tests/vitest/mocks.helper';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { RemoteTreeBuilder } from '../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';

const makeBackup = (folderUuid: string): BackupInfo => ({
  folderUuid,
  folderId: 1,
  tmpPath: '/tmp/backup',
  backupsBucket: 'bucket',
  pathname: `/home/user/${folderUuid}` as AbsolutePath,
  name: folderUuid,
});

describe('calculateBackupsItemsCount', () => {
  let container: Container;
  let remoteTreeBuilder: RemoteTreeBuilder;
  let signal: AbortSignal;
  const precalcuteBackupItemCountMock = partialSpyOn(precalculateBackupItemCountModule, 'precalculateBackupItemCount');

  beforeEach(() => {
    remoteTreeBuilder = {} as RemoteTreeBuilder;
    container = { get: vi.fn().mockReturnValue(remoteTreeBuilder) } as unknown as Container;
    signal = new AbortController().signal;
  });

  it('returns an empty map when no backups are provided', async () => {
    const result = await calculateBackupsItemsCount({ backups: [], signal, container });

    expect(result).toStrictEqual(new Map());
    expect(precalcuteBackupItemCountMock).not.toBeCalled();
  });

  it('returns a map with counts for each backup', async () => {
    const backups = [makeBackup('uuid-1'), makeBackup('uuid-2')];
    precalcuteBackupItemCountMock.mockResolvedValueOnce({ data: 5 }).mockResolvedValueOnce({ data: 3 });

    const result = await calculateBackupsItemsCount({ backups, signal, container });

    expect(result.get('uuid-1')).toBe(5);
    expect(result.get('uuid-2')).toBe(3);
    expect(result.size).toBe(2);
  });

  it('calls precalculateBackupItemCount with the correct backup and remote tree builder', async () => {
    const backup = makeBackup('uuid-1');
    precalcuteBackupItemCountMock.mockResolvedValueOnce({ data: 7 });

    await calculateBackupsItemsCount({ backups: [backup], signal, container });

    expect(container.get).toBeCalledWith(RemoteTreeBuilder);
    expect(precalcuteBackupItemCountMock).toBeCalledWith(backup, remoteTreeBuilder);
  });

  it('stops processing when signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const abortedSignal = controller.signal;

    const backups = [makeBackup('uuid-1'), makeBackup('uuid-2')];

    const result = await calculateBackupsItemsCount({ backups, signal: abortedSignal, container });

    expect(result.size).toBe(0);
    expect(precalcuteBackupItemCountMock).not.toBeCalled();
  });

  it('stops processing mid-loop when signal is aborted between items', async () => {
    const controller = new AbortController();
    const backups = [makeBackup('uuid-1'), makeBackup('uuid-2'), makeBackup('uuid-3')];

    precalcuteBackupItemCountMock.mockImplementation(async (backup) => {
      if (backup.folderUuid === 'uuid-1') {
        controller.abort();
        return { data: 10 };
      }
      return { data: 5 };
    });

    const result = await calculateBackupsItemsCount({ backups, signal: controller.signal, container });

    expect(result.get('uuid-1')).toBe(10);
    expect(result.has('uuid-2')).toBe(false);
    expect(result.has('uuid-3')).toBe(false);
    expect(precalcuteBackupItemCountMock).toBeCalledTimes(1);
  });

  it('logs a debug message when aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await calculateBackupsItemsCount({ backups: [makeBackup('uuid-1')], signal: controller.signal, container });

    expect(loggerMock.debug).toBeCalledWith(expect.objectContaining({ tag: 'BACKUPS', msg: 'Precalculation aborted' }));
  });
});
