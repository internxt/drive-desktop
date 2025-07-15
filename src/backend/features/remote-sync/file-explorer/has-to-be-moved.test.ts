import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { hasToBeMoved } from './has-to-be-moved';
import { win32 } from 'path';

describe('has-to-be-moved', () => {
  const rootPath = win32.join('C:', 'Users', 'user', 'InternxtDrive');
  const localPath = win32.join(rootPath, 'folder1', 'folder2', 'folder3') as AbsolutePath;

  it('should return false if path is the same', () => {
    const remotePath = win32.join(rootPath, 'folder1', 'folder2', 'folder3') as AbsolutePath;
    const hasBeenMoved = hasToBeMoved({ remotePath, localPath });
    expect(hasBeenMoved).toBe(false);
  });

  it('should return true if item has been renamed', () => {
    const remotePath = win32.join(rootPath, 'folder1', 'folder2', 'renamed') as AbsolutePath;
    const hasBeenMoved = hasToBeMoved({ remotePath, localPath });
    expect(hasBeenMoved).toBe(true);
  });

  it('should return true if item has been moved', () => {
    const remotePath = win32.join(rootPath, 'folder1', 'moved', 'folder3') as AbsolutePath;
    const hasBeenMoved = hasToBeMoved({ remotePath, localPath });
    expect(hasBeenMoved).toBe(true);
  });

  it('should return false if another folder has been moved', () => {
    const remotePath = win32.join(rootPath, 'moved', 'folder2', 'folder3') as AbsolutePath;
    const hasBeenMoved = hasToBeMoved({ remotePath, localPath });
    expect(hasBeenMoved).toBe(false);
  });

  it('should return true if moved and renamed', () => {
    const remotePath = win32.join(rootPath, 'folder1', 'moved', 'renamed') as AbsolutePath;
    const hasBeenMoved = hasToBeMoved({ remotePath, localPath });
    expect(hasBeenMoved).toBe(true);
  });
});
