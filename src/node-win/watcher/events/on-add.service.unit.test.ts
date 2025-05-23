import { Stats } from 'fs';
import { mockDeep } from 'vitest-mock-extended';

import { Watcher } from '../watcher';
import { OnAddService } from './on-add.service';
import { PinState, SyncState } from '@/node-win/types/placeholder.type';
import { typeQueue } from '@/node-win/queue/queueManager';

describe('Watcher onAdd', () => {
  const watcher = mockDeep<Watcher>();
  const onAdd = new OnAddService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Should enqueue an "add" task if the file is new', () => {
    // Arrange
    watcher.addon.getFileIdentity.mockReturnValue('');
    watcher.addon.getPlaceholderState.mockReturnValue({
      pinState: PinState.Unspecified,
      syncState: SyncState.NotInSync,
    });

    const path = 'C:\\test-drive\\folder\\newfile.txt';
    const stats = { size: 1024, birthtime: new Date(), mtime: new Date() };

    // Act
    onAdd.execute({ self: watcher, path, stats: stats as unknown as Stats });

    // Assert
    expect(watcher.addon.getFileIdentity).toHaveBeenCalledWith({ path });
    expect(watcher.addon.getPlaceholderState).toHaveBeenCalledWith({ path });
    expect(watcher.queueManager.enqueue).toHaveBeenCalledWith({ path, type: typeQueue.add, isFolder: false });
  });

  it('Should not enqueue if the file is already in AlwaysLocal and InSync states', () => {
    // Arrange
    watcher.addon.getFileIdentity.mockReturnValue('existing-file-id');
    watcher.addon.getPlaceholderState.mockReturnValue({
      pinState: PinState.AlwaysLocal,
      syncState: SyncState.InSync,
    });

    const path = 'C:\\test-drive\\folder\\existingFile.txt';
    const stats = { size: 2048, birthtime: new Date(), mtime: new Date() };

    // Act
    onAdd.execute({ self: watcher, path, stats: stats as unknown as Stats });

    // Assert
    expect(watcher.queueManager.enqueue).not.toHaveBeenCalled();
  });
});
