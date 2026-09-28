import { existsSync } from 'node:fs';
import { addBackupsIssue, addSyncIssue, clearIssues, countBackupUploadIssues, issues, removeUploadIssues, setUploadIssue } from './issues';

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

  it('should keep the same backup issue of different folders', () => {
    // Given
    addBackupsIssue({ name: '/file.mp4', folderUuid: 'folderUuid', error: 'UPLOAD_FAILED' });
    // When
    addBackupsIssue({ name: '/file.mp4', folderUuid: 'nestedFolderUuid', error: 'UPLOAD_FAILED' });
    addBackupsIssue({ name: '/file.mp4', folderUuid: 'folderUuid', error: 'UPLOAD_FAILED' });
    // Then
    expect(countBackupUploadIssues({ folderUuid: 'folderUuid' })).toBe(1);
    expect(countBackupUploadIssues({ folderUuid: 'nestedFolderUuid' })).toBe(1);
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

  it('should not check the disk when adding an upload issue', () => {
    // Given
    setUploadIssue({ path: '/file.mp4', error: 'UPLOAD_FAILED' });
    // When
    setUploadIssue({ path: '/other.mp4', error: 'UPLOAD_FAILED' });
    // Then
    expect(existsSyncMock).not.toHaveBeenCalled();
  });

  it('should count the backup upload issues of a folder', () => {
    // Given
    addBackupsIssue({ name: '/a.mp4', folderUuid: 'folderUuid', error: 'UPLOAD_FAILED' });
    addBackupsIssue({ name: '/b.mp4', folderUuid: 'folderUuid', error: 'FILE_NOT_READY' });
    addBackupsIssue({ name: '/c.mp4', folderUuid: 'folderUuid', error: 'FILE_SIZE_TOO_BIG' });
    addBackupsIssue({ name: '/d.mp4', folderUuid: 'otherFolderUuid', error: 'UPLOAD_FAILED' });
    setUploadIssue({ path: '/e.mp4', error: 'UPLOAD_FAILED' });
    // When
    const count = countBackupUploadIssues({ folderUuid: 'folderUuid' });
    // Then
    expect(count).toBe(2);
  });

  it('should not remove the backup upload issues when a file of the sync folder changes', () => {
    // Given
    addBackupsIssue({ name: '/file.mp4', folderUuid: 'folderUuid', error: 'UPLOAD_FAILED' });
    existsSyncMock.mockReturnValue(false);
    // When
    removeUploadIssues({ path: '/file.mp4' });
    // Then
    expect(issues).toStrictEqual([{ tab: 'backups', name: '/file.mp4', folderUuid: 'folderUuid', error: 'UPLOAD_FAILED' }]);
  });
});
