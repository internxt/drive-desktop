import { existsSync } from 'node:fs';
import {
  addBackupsIssue,
  addSyncIssue,
  clearIssues,
  issues,
  removeUploadIssues,
  setUploadIssue,
} from './issues';

vi.mock(import('node:fs'));

describe('issues', () => {
  const existsSyncMock = vi.mocked(existsSync);

  beforeEach(() => {
    clearIssues();
    existsSyncMock.mockReturnValue(true);
  });

  it('Should have no issues', () => {
    expect(issues).toHaveLength(0);
  });

  it('Should add an issue', () => {
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });

    expect(issues).toHaveLength(1);
  });

  it('Should not add an issue if it already exists', () => {
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addSyncIssue({ name: 'test', error: 'INVALID_WINDOWS_NAME' });
    addSyncIssue({ name: 'test2', error: 'INVALID_WINDOWS_NAME' });

    expect(issues).toHaveLength(2);
  });

  it('should keep only the latest upload issue of a file', () => {
    // Given
    setUploadIssue({ path: '/file.mp4', error: 'FILE_NOT_READY' });
    // When
    setUploadIssue({ path: '/file.mp4', error: 'UPLOAD_FAILED' });
    // Then
    expect(issues).toStrictEqual([{ tab: 'sync', name: '/file.mp4', error: 'UPLOAD_FAILED' }]);
  });

  it('should remove the upload issues of a file and keep the rest', () => {
    // Given
    setUploadIssue({ path: '/file.mp4', error: 'UPLOAD_FAILED' });
    setUploadIssue({ path: '/other.mp4', error: 'UPLOAD_FAILED' });
    addSyncIssue({ name: '/file.mp4', error: 'FILE_SIZE_TOO_BIG' });
    addBackupsIssue({ name: '/file.mp4', folderUuid: 'folderUuid', error: 'FILE_SIZE_TOO_BIG' });
    // When
    removeUploadIssues({ path: '/file.mp4' });
    // Then
    expect(issues).toStrictEqual([
      { tab: 'sync', name: '/other.mp4', error: 'UPLOAD_FAILED' },
      { tab: 'sync', name: '/file.mp4', error: 'FILE_SIZE_TOO_BIG' },
      { tab: 'backups', name: '/file.mp4', folderUuid: 'folderUuid', error: 'FILE_SIZE_TOO_BIG' },
    ]);
  });

  it('should remove the upload issues of files that no longer exist', () => {
    // Given
    setUploadIssue({ path: '/renamed-before.mp4', error: 'UPLOAD_FAILED' });
    setUploadIssue({ path: '/still-here.mp4', error: 'FILE_NOT_READY' });
    existsSyncMock.mockImplementation((path) => path !== '/renamed-before.mp4');
    // When
    removeUploadIssues({ path: '/uploaded.mp4' });
    // Then
    expect(issues).toStrictEqual([{ tab: 'sync', name: '/still-here.mp4', error: 'FILE_NOT_READY' }]);
  });
});
