import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RemoteTreeBuilder } from '../../../context/virtual-drive/remoteTree/application/RemoteTreeBuilder';
import { DiffFilesCalculatorService } from '../../../apps/backups/diff/DiffFilesCalculatorService';
import { FoldersDiffCalculator } from '../../../apps/backups/diff/FoldersDiffCalculator';
import { precalculateBackupItemCount } from './precalculate-backup-item-count';
import { AbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import * as buildLocalTreeModule from './local-tree/';
import { LocalTreeMother } from '../../../context/local/localTree/domain/__test-helpers__/LocalTreeMother';
import { DriveDesktopError } from '../../../context/shared/domain/errors/DriveDesktopError';

vi.mock(import('./local-tree/'));

describe('precalculateBackupItemCount', () => {
  const backupInfo = {
    folderUuid: 'folder-uuid',
    folderId: 42,
    tmpPath: '/tmp/backup',
    backupsBucket: 'bucket',
    pathname: '/home/user/Documents' as AbsolutePath,
    name: 'Documents',
  };

  const remoteTree = { root: { path: '/remote/Documents' } };
  const buildLocalTreeMock = vi.mocked(buildLocalTreeModule.buildLocalTree);

  let remoteTreeBuilder: { run: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    buildLocalTreeMock.mockResolvedValue({ data: { tree: LocalTreeMother.oneLevel(10), skippedItems: [] } });
    remoteTreeBuilder = {
      run: vi.fn(),
    };
  });

  it('returns total item count when precalculation succeeds', async () => {
    remoteTreeBuilder.run.mockResolvedValue(remoteTree);

    vi.spyOn(DiffFilesCalculatorService, 'calculate').mockReturnValue({ total: 7 } as never);
    vi.spyOn(FoldersDiffCalculator, 'calculate').mockReturnValue({ total: 3 } as never);

    const result = await precalculateBackupItemCount(backupInfo, remoteTreeBuilder as unknown as RemoteTreeBuilder);

    expect(result.data).toBe(10);
    expect(remoteTreeBuilder.run).toBeCalledWith(backupInfo.folderId, backupInfo.folderUuid, true);
  });

  it('returns an error when local tree build returns left', async () => {
    buildLocalTreeMock.mockResolvedValueOnce({ error: new DriveDesktopError('NOT_EXISTS', 'local tree error') });

    const filesSpy = vi.spyOn(DiffFilesCalculatorService, 'calculate');
    const foldersSpy = vi.spyOn(FoldersDiffCalculator, 'calculate');

    const result = await precalculateBackupItemCount(backupInfo, remoteTreeBuilder as unknown as RemoteTreeBuilder);

    expect(result.error).toBeDefined();
    expect(remoteTreeBuilder.run).not.toHaveBeenCalled();
    expect(filesSpy).not.toHaveBeenCalled();
    expect(foldersSpy).not.toHaveBeenCalled();
  });

  it('returns an error when buildLocalTree throws', async () => {
    const runError = new Error('unexpected failure');
    buildLocalTreeMock.mockRejectedValueOnce(runError);

    const result = await precalculateBackupItemCount(backupInfo, remoteTreeBuilder as unknown as RemoteTreeBuilder);

    expect(result.error).toBe(runError);
  });

  it('returns an error when remoteTreeBuilder throws', async () => {
    const runError = new Error('remote failure');
    remoteTreeBuilder.run.mockRejectedValue(runError);

    const result = await precalculateBackupItemCount(backupInfo, remoteTreeBuilder as unknown as RemoteTreeBuilder);

    expect(result.error).toBe(runError);
  });
});
