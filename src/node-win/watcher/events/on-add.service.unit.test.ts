import { mockDeep } from 'vitest-mock-extended';

import { Watcher } from '../watcher';
import { typeQueue } from '@/node-win/queue/queueManager';
import { onAdd } from './on-add.service';
import { mockProps } from '@/tests/vitest/utils.helper.test';
import { BucketEntry } from '@/context/virtual-drive/shared/domain/BucketEntry';

describe('Watcher onAdd', () => {
  const watcher = mockDeep<Watcher>();

  const path = 'path';
  const date1 = new Date();
  const date2 = new Date();
  const stats = { size: 1024 };
  const baseProps = mockProps<typeof onAdd>({ self: watcher, path, stats });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not enqueue if the file is empty', () => {
    // Arrange
    const props = mockProps<typeof onAdd>({ stats: { size: 0 } });

    // Act
    onAdd(props);

    // Assert
    expect(watcher.queueManager.enqueue).not.toHaveBeenCalled();
  });

  it('should not enqueue if the file is larger than MAX_SIZE', () => {
    // Arrange
    const props = mockProps<typeof onAdd>({ stats: { size: BucketEntry.MAX_SIZE + 1 } });

    // Act
    onAdd(props);

    // Assert
    expect(watcher.queueManager.enqueue).not.toHaveBeenCalled();
  });

  it('should not enqueue if the file is moved', () => {
    // Arrange
    watcher.addon.getFileIdentity.mockReturnValue('FILE:placeholderId');
    const props = mockProps<typeof onAdd>({
      self: watcher,
      path,
      stats: { size: 1024, birthtime: date1, mtime: date2 },
    });

    // Act
    onAdd(props);

    // Assert
    expect(watcher.queueManager.enqueue).not.toHaveBeenCalled();
  });

  it('should not enqueue if the file is added from remote', () => {
    // Arrange
    watcher.addon.getFileIdentity.mockReturnValue('FILE:placeholderId');
    const props = mockProps<typeof onAdd>({
      self: watcher,
      path,
      stats: { size: 1024, birthtime: date1, mtime: date1 },
    });

    // Act
    onAdd(props);

    // Assert
    expect(watcher.queueManager.enqueue).not.toHaveBeenCalled();
  });

  it('should enqueue a task if the file is new', () => {
    // Arrange
    watcher.addon.getFileIdentity.mockReturnValue('');
    const props = mockProps<typeof onAdd>({
      self: watcher,
      path,
      stats: { size: 1024 },
    });

    // Act
    onAdd(props);

    // Assert
    expect(watcher.addon.getFileIdentity).toHaveBeenCalledWith({ path });
    expect(watcher.queueManager.enqueue).toHaveBeenCalledWith({ path, type: typeQueue.add, isFolder: false });
  });
});
