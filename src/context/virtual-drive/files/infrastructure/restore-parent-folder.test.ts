import { describe, it, expect } from 'vitest';
import { restoreParentFolder } from './restore-parent-folder';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import * as getConfig from '@/apps/sync-engine/config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { partialSpyOn, mockProps, getMockCalls } from '@/tests/vitest/utils.helper.test';
import { FolderUuid } from '../../folders/domain/FolderPlaceholderId';

describe('restoreParentFolder', () => {
  const dirnameSpy = partialSpyOn(pathUtils, 'dirname');
  const getFolderUuidSpy = partialSpyOn(NodeWin, 'getFolderUuid');
  const existsFolderSpy = partialSpyOn(driveServerWip.folders, 'existsFolder');
  const getConfigSpy = partialSpyOn(getConfig, 'getConfig');
  const moveSpy = partialSpyOn(driveServerWip.folders, 'moveFolder');
  const renameSpy = partialSpyOn(driveServerWip.folders, 'renameFolder');
  const loggerSpy = partialSpyOn(logger, 'error');

  it('does nothing when remote parent exists', async () => {
    dirnameSpy.mockImplementationOnce(() => '/gp/child' as RelativePath).mockImplementationOnce(() => '/gp' as RelativePath);
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    existsFolderSpy.mockResolvedValue({
      data: { existentFolders: [{ uuid: 'remote-parent-uuid' }] },
    });

    const props = mockProps<typeof restoreParentFolder>({
      offline: { path: '/gp/child/file.txt' as RelativePath, folderUuid: 'offline-folder-uuid' },
      drive: {},
    });

    await restoreParentFolder(props);

    expect(moveSpy).not.toHaveBeenCalled();
    expect(renameSpy).not.toHaveBeenCalled();
  });

  it('moves and renames when remote parent does not exist', async () => {
    dirnameSpy.mockImplementationOnce(() => '/gp/child' as RelativePath).mockImplementationOnce(() => '/gp' as RelativePath);
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    existsFolderSpy.mockResolvedValue({
      data: { existentFolders: [] },
    });
    getConfigSpy.mockReturnValue({ workspaceToken: 'WT' });
    moveSpy.mockResolvedValue({ error: undefined });
    renameSpy.mockResolvedValue({ error: undefined });

    const props = mockProps<typeof restoreParentFolder>({
      offline: { path: '/gp/child/file.txt' as RelativePath, folderUuid: 'offline-folder-uuid' },
      drive: {},
    });

    await restoreParentFolder(props);

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(renameSpy).toHaveBeenCalledTimes(1);

    const [moveArgs] = getMockCalls(moveSpy);
    expect(moveArgs).toMatchObject({
      parentUuid: 'parent-uuid',
      workspaceToken: 'WT',
      uuid: 'offline-folder-uuid',
    });

    const [renameArgs] = getMockCalls(renameSpy);
    expect(renameArgs).toMatchObject({
      name: 'child',
      workspaceToken: 'WT',
      uuid: 'offline-folder-uuid',
    });
  });

  it('throws if move or rename fail, logging the error', async () => {
    dirnameSpy.mockImplementationOnce(() => '/gp/child' as RelativePath).mockImplementationOnce(() => '/gp' as RelativePath);
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    existsFolderSpy.mockResolvedValue({
      data: { existentFolders: [] },
    });
    getConfigSpy.mockReturnValue({ workspaceToken: 'WT' });
    moveSpy.mockResolvedValue({ error: {} });
    renameSpy.mockResolvedValue({ error: undefined });
    loggerSpy.mockImplementation(() => new Error('Error restoring parent folder'));

    const props = mockProps<typeof restoreParentFolder>({
      offline: { path: '/gp/child/file.txt' as RelativePath, folderUuid: 'offline-folder-uuid' },
      drive: {},
    });

    await expect(restoreParentFolder(props)).rejects.toBeInstanceOf(Error);

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(renameSpy).toHaveBeenCalledTimes(1);

    const [logArgs] = getMockCalls(loggerSpy);
    expect(logArgs).toMatchObject({ msg: 'Error restoring parent folder' });
  });
});
