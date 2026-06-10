import { Addon } from '@/node-win/addon-wrapper';
import { InSyncState, PinState } from '@/node-win/types/placeholder.type';
import { resolveContextMenuItem } from './resolve-context-menu-item';

vi.mock(import('@/node-win/addon-wrapper'));

describe('resolve context menu item', () => {
  const getPlaceholderStateMock = vi.mocked(Addon.getPlaceholderState);
  const state = {
    pinState: PinState.Unspecified,
    inSyncState: InSyncState.Sync,
    onDiskSize: 0,
  };

  it('resolves a file identity', async () => {
    getPlaceholderStateMock.mockResolvedValue({
      ...state,
      placeholderId: 'FILE:3a0148f9-e21d-49bb-bf56-8438e5d7aa25',
      uuid: '3a0148f9-e21d-49bb-bf56-8438e5d7aa25',
    });

    await expect(resolveContextMenuItem(String.raw`C:\InternxtDrive\document.pdf`)).resolves.toEqual({
      type: 'file',
      uuid: '3a0148f9-e21d-49bb-bf56-8438e5d7aa25',
    });
  });

  it('resolves a folder identity', async () => {
    getPlaceholderStateMock.mockResolvedValue({
      ...state,
      placeholderId: 'FOLDER:d1940869-4b4f-4d97-bcc2-73e8906a6a97',
      uuid: 'd1940869-4b4f-4d97-bcc2-73e8906a6a97',
    });

    await expect(resolveContextMenuItem(String.raw`C:\InternxtDrive\folder`)).resolves.toEqual({
      type: 'folder',
      uuid: 'd1940869-4b4f-4d97-bcc2-73e8906a6a97',
    });
  });

  it('returns null when placeholder metadata cannot be read', async () => {
    getPlaceholderStateMock.mockRejectedValue(new Error('Placeholder unavailable'));

    await expect(resolveContextMenuItem(String.raw`C:\InternxtDrive\missing.txt`)).resolves.toBeNull();
  });
});
