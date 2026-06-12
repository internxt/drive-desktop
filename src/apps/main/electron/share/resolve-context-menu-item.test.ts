import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { getSyncContextFromPath } from './get-sync-context-from-path';
import { resolveContextMenuItem } from './resolve-context-menu-item';

vi.mock(import('@/node-win/addon-wrapper'));
vi.mock(import('./get-sync-context-from-path'));

describe('resolveContextMenuItem', () => {
  const getPlaceholderStateMock = vi.mocked(Addon.getPlaceholderState);
  const getSyncContextFromPathMock = vi.mocked(getSyncContextFromPath);
  const ctx = {
    rootPath: String.raw`C:\InternxtDrive`,
    rootUuid: 'ef9a4659-3356-414c-9b66-b259b8b42285' as FolderUuid,
  } as SyncContext;
  const state = {
    pinState: PinState.Unspecified,
    inSyncState: InSyncState.Sync,
    onDiskSize: 0,
  };

  beforeEach(() => {
    getSyncContextFromPathMock.mockReturnValue(ctx);
  });

  it('should resolve a file identity', async () => {
    getPlaceholderStateMock.mockResolvedValue({
      ...state,
      placeholderId: 'FILE:3a0148f9-e21d-49bb-bf56-8438e5d7aa25',
      uuid: '3a0148f9-e21d-49bb-bf56-8438e5d7aa25',
    });

    await expect(resolveContextMenuItem(String.raw`C:\InternxtDrive\document.pdf`)).resolves.toEqual({
      item: {
        type: 'file',
        uuid: '3a0148f9-e21d-49bb-bf56-8438e5d7aa25',
      },
      ctx,
    });
  });

  it('should resolve a folder identity', async () => {
    getPlaceholderStateMock.mockResolvedValue({
      ...state,
      placeholderId: 'FOLDER:d1940869-4b4f-4d97-bcc2-73e8906a6a97',
      uuid: 'd1940869-4b4f-4d97-bcc2-73e8906a6a97',
    });

    await expect(resolveContextMenuItem(String.raw`C:\InternxtDrive\folder`)).resolves.toEqual({
      item: {
        type: 'folder',
        uuid: 'd1940869-4b4f-4d97-bcc2-73e8906a6a97',
      },
      ctx,
    });
  });

  it('should return null when no active sync context owns the path', async () => {
    getSyncContextFromPathMock.mockReturnValue(null);

    await expect(resolveContextMenuItem(String.raw`C:\Outside\file.txt`)).resolves.toBeNull();
    expect(getPlaceholderStateMock).not.toHaveBeenCalled();
  });

  it('should return null when placeholder metadata cannot be read', async () => {
    getPlaceholderStateMock.mockRejectedValue(new Error('Placeholder unavailable'));

    await expect(resolveContextMenuItem(String.raw`C:\InternxtDrive\missing.txt`)).resolves.toBeNull();
  });
});
