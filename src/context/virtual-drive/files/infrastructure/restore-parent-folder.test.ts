import { describe, it, expect } from 'vitest';
import { restoreParentFolder } from './restore-parent-folder';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { driveServerWip } from '@/infra/drive-server-wip/drive-server-wip.module';
import { pathUtils, RelativePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { partialSpyOn, mockProps, getMockCalls } from '@/tests/vitest/utils.helper.test';
import { FolderUuid } from '../../folders/domain/FolderPlaceholderId';
import { loggerMock } from '@/tests/vitest/mocks.helper.test';

describe('restoreParentFolder', () => {
  const dirnameSpy = partialSpyOn(pathUtils, 'dirname');
  const getFolderUuidSpy = partialSpyOn(NodeWin, 'getFolderUuid');
  const moveSpy = partialSpyOn(driveServerWip.folders, 'moveFolder');
  const renameSpy = partialSpyOn(driveServerWip.folders, 'renameFolder');

  const props = mockProps<typeof restoreParentFolder>({
    offline: { path: '/gp/child/file.txt' as RelativePath, folderUuid: 'offline-folder-uuid' },
    ctx: { workspaceToken: 'WT' },
  });

  beforeEach(() => {
    dirnameSpy.mockReturnValueOnce('/gp/child' as RelativePath).mockReturnValueOnce('/gp' as RelativePath);
    getFolderUuidSpy.mockReturnValue({ data: 'parent-uuid' as FolderUuid });
    moveSpy.mockResolvedValue({ error: undefined });
    renameSpy.mockResolvedValue({ error: undefined });
  });

  it('moves and renames when remote parent does not exist', async () => {
    await restoreParentFolder(props);

    expect(moveSpy).toBeCalledTimes(1);
    expect(renameSpy).toBeCalledTimes(1);

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
    moveSpy.mockResolvedValue({ error: {} });

    await expect(restoreParentFolder(props)).rejects.toThrow();

    expect(moveSpy).toBeCalledTimes(1);
    expect(renameSpy).toBeCalledTimes(1);

    expect(loggerMock.error).toBeCalledWith(expect.objectContaining({ msg: 'Error restoring parent folder' }));
  });

  it('throws and logs when parentUuid is missing', async () => {
    getFolderUuidSpy.mockReturnValue({ data: undefined });

    await expect(restoreParentFolder(props)).rejects.toThrow();

    expect(loggerMock.error).toBeCalledWith(
      expect.objectContaining({
        msg: 'Could not restore parent folder, parentUuid not found',
        path: '/gp/child/file.txt',
      }),
    );

    expect(moveSpy).not.toBeCalled();
    expect(renameSpy).not.toBeCalled();
  });
});
