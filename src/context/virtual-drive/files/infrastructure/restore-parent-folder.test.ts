import { describe, it, expect, beforeEach } from 'vitest';
import { restoreParentFolder } from './restore-parent-folder';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PlatformPathConverter } from '../../shared/application/PlatformPathConverter';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { HttpRemoteFileSystem } from './HttpRemoteFileSystem';
import * as getConfig from '@/apps/sync-engine/config';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { partialSpyOn, mockProps, getMockCalls } from '@/tests/vitest/utils.helper.test';
import { FolderUuid } from '../../folders/domain/FolderPlaceholderId';

describe('restoreParentFolder', () => {
  const fatherSpy = partialSpyOn(PlatformPathConverter, 'getFatherPathPosix');
  const getFolderUuidSpy = partialSpyOn(NodeWin, 'getFolderUuid');
  const existsSpy = partialSpyOn(driveServerWip.folders, 'existsFolder');
  const getConfigSpy = partialSpyOn(getConfig, 'getConfig');
  const moveSpy = partialSpyOn(driveServerWip.folders, 'moveFolder');
  const renameSpy = partialSpyOn(driveServerWip.folders, 'renameFolder');
  const createSpy = partialSpyOn(HttpRemoteFileSystem, 'create');
  const loggerSpy = partialSpyOn(logger, 'error');

  beforeEach(() => {
    fatherSpy.mockReset();
    getFolderUuidSpy.mockReset();
    existsSpy.mockReset();
    getConfigSpy.mockReset();
    moveSpy.mockReset();
    renameSpy.mockReset();
    createSpy.mockReset();
    loggerSpy.mockReset();
  });

  it('does not move/rename when remote parent exists and creates the remote file', async () => {
    fatherSpy.mockImplementationOnce(() => '/gp/child').mockImplementationOnce(() => '/gp');
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    existsSpy.mockResolvedValue({ data: { existentFolders: [{ uuid: 'remote-parent-uuid' }] } });
    createSpy.mockResolvedValue({});
    const props = mockProps<typeof restoreParentFolder>({ offline: { path: '/gp/child/file.txt' } });
    await restoreParentFolder(props);

    expect(moveSpy).not.toHaveBeenCalled();
    expect(renameSpy).not.toHaveBeenCalled();
  });

  it('moves and renames when remote parent does not exist, then creates the remote file', async () => {
    fatherSpy.mockImplementationOnce(() => '/gp/child').mockImplementationOnce(() => '/gp');
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    existsSpy.mockResolvedValue({ data: { existentFolders: [] } });
    getConfigSpy.mockReturnValue({ workspaceToken: 'WT' });
    moveSpy.mockResolvedValue({});
    renameSpy.mockResolvedValue({});
    createSpy.mockResolvedValue({});
    const props = mockProps<typeof restoreParentFolder>({
      offline: { path: '/gp/child/file.txt', size: 10, folderUuid: 'offline-folder-uuid', contentsId: 'cid-1' },
      bucket: 'bucket-1',
      workspaceId: 'wid-1',
    });
    await restoreParentFolder(props);

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(renameSpy).toHaveBeenCalledTimes(1);

    const [moveArgs] = getMockCalls(moveSpy);
    expect(moveArgs).toMatchObject({ parentUuid: 'parent-uuid', workspaceToken: 'WT', uuid: 'offline-folder-uuid' });

    const [renameArgs] = getMockCalls(renameSpy);
    expect(renameArgs).toMatchObject({ name: 'child', workspaceToken: 'WT', uuid: 'offline-folder-uuid' });

    const [createArgs] = getMockCalls(createSpy);
    expect(createArgs).toMatchObject({
      contentsId: 'cid-1',
      path: '/gp/child/file.txt',
      bucket: 'bucket-1',
      workspaceId: 'wid-1',
      size: 10,
      folderUuid: 'offline-folder-uuid',
    });
  });

  it('throws if move or rename fail, logging the error', async () => {
    fatherSpy.mockImplementationOnce(() => '/gp/child').mockImplementationOnce(() => '/gp');
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    existsSpy.mockResolvedValue({ data: { existentFolders: [] } });
    getConfigSpy.mockReturnValue({ workspaceToken: 'WT' });
    moveSpy.mockResolvedValue({ error: {} });
    renameSpy.mockResolvedValue({ error: undefined });
    loggerSpy.mockImplementation(() => new Error('Error restoring parent folder'));
    const props = mockProps<typeof restoreParentFolder>({ offline: {} });
    await expect(restoreParentFolder(props)).rejects.toBeInstanceOf(Error);

    expect(moveSpy).toHaveBeenCalledTimes(1);
    expect(renameSpy).toHaveBeenCalledTimes(1);

    const [logArgs] = getMockCalls(loggerSpy);
    expect(logArgs).toMatchObject({ msg: 'Error restoring parent folder' });
  });
});
