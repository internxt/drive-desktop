import configStoreModule from '../../../apps/main/config';
import { partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { findBackupPathnameFromId } from './find-backup-pathname-from-id';

describe('find-backup-pathname-from-id', () => {
  const configStoreGetMock = partialSpyOn(configStoreModule, 'get');

  it('should return pathname when backup id exists', () => {
    configStoreGetMock.mockReturnValue({
      '/home/dev/Documents': { folderId: 1, enabled: true, folderUuid: 'uuid-1' },
      '/home/dev/Pictures': { folderId: 2, enabled: true, folderUuid: 'uuid-2' },
    });

    const result = findBackupPathnameFromId({ id: 2 });

    expect(result).toBe('/home/dev/Pictures');
  });

  it('should return undefined when backup id does not exist', () => {
    configStoreGetMock.mockReturnValue({
      '/home/dev/Documents': { folderId: 1, enabled: true, folderUuid: 'uuid-1' },
    });

    const result = findBackupPathnameFromId({ id: 99 });

    expect(result).toBeUndefined();
  });
});
