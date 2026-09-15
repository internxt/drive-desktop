import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { addUnreconciledFolder } from './add-unreconciled-folder';
import { isInsideUnreconciledFolder } from './is-inside-unreconciled-folder';
import { removeUnreconciledFolder } from './remove-unreconciled-folder';

describe('is-inside-unreconciled-folder', () => {
  const uuid = 'uuid' as FolderUuid;

  beforeEach(() => {
    removeUnreconciledFolder({ uuid });
  });

  it('should return false if there are no unreconciled folders', () => {
    // When
    const res = isInsideUnreconciledFolder({ path: abs('/root/folder/file.txt') });
    // Then
    expect(res).toBe(false);
  });

  it('should return true for the unreconciled folder itself', () => {
    // Given
    addUnreconciledFolder({ uuid, path: abs('/root/folder') });
    // When
    const res = isInsideUnreconciledFolder({ path: abs('/root/folder') });
    // Then
    expect(res).toBe(true);
  });

  it('should return true for an item inside the unreconciled folder', () => {
    // Given
    addUnreconciledFolder({ uuid, path: abs('/root/folder') });
    // When
    const res = isInsideUnreconciledFolder({ path: abs('/root/folder/nested/file.txt') });
    // Then
    expect(res).toBe(true);
  });

  it('should ignore case because windows paths are case insensitive', () => {
    // Given
    addUnreconciledFolder({ uuid, path: abs('/root/Folder') });
    // When
    const res = isInsideUnreconciledFolder({ path: abs('/root/FOLDER/file.txt') });
    // Then
    expect(res).toBe(true);
  });

  it('should not match a sibling that shares the prefix', () => {
    // Given
    addUnreconciledFolder({ uuid, path: abs('/root/folder') });
    // When
    const res = isInsideUnreconciledFolder({ path: abs('/root/folder2/file.txt') });
    // Then
    expect(res).toBe(false);
  });

  it('should return false once the folder is reconciled again', () => {
    // Given
    addUnreconciledFolder({ uuid, path: abs('/root/folder') });
    removeUnreconciledFolder({ uuid });
    // When
    const res = isInsideUnreconciledFolder({ path: abs('/root/folder/file.txt') });
    // Then
    expect(res).toBe(false);
  });
});
