import { aes } from '@internxt/lib';
import * as fetchFolderTreeByUuidModule from '../../../infra/drive-server/services/folder/services/fetch-folder-tree-by-uuid';
import * as buildBackupFolderTreeSnapshotModule from './build-backup-folder-tree-snapshot';
import { call, partialSpyOn } from '../../../../tests/vitest/utils.helper';
import { getBackupFolderTreeSnapshot } from './get-backup-folder-tree-snapshot';

describe('get-backup-folder-tree-snapshot', () => {
  const fetchFolderTreeByUuidMock = partialSpyOn(fetchFolderTreeByUuidModule, 'fetchFolderTreeByUuid');
  const buildBackupFolderTreeSnapshotMock = partialSpyOn(
    buildBackupFolderTreeSnapshotModule,
    'buildBackupFolderTreeSnapshot',
  );
  const aesDecryptMock = partialSpyOn(aes, 'decrypt');

  it('should return an error when fetching folder tree fails', async () => {
    const error = new Error('Unsuccesful request to fetch folder tree');
    fetchFolderTreeByUuidMock.mockResolvedValue({ error: new Error('fetch failed') } as never);

    await expect(getBackupFolderTreeSnapshot({ folderUuid: 'folder-uuid' })).resolves.toStrictEqual({ error });
  });

  it('should build backup tree snapshot and provide decrypt function', async () => {
    process.env.NEW_CRYPTO_KEY = 'crypto-key';
    const tree = { id: 10, children: [], files: [], plainName: 'Root' };
    const expectedSnapshot = { tree, size: 0, folderDecryptedNames: {}, fileDecryptedNames: {} };

    fetchFolderTreeByUuidMock.mockResolvedValue({ data: { tree } } as never);
    buildBackupFolderTreeSnapshotMock.mockImplementation(({ decryptFileName }) => {
      decryptFileName('encrypted-name', 10);
      return expectedSnapshot as never;
    });
    aesDecryptMock.mockReturnValue('decrypted-name');

    const result = await getBackupFolderTreeSnapshot({ folderUuid: 'folder-uuid' });

    call(fetchFolderTreeByUuidMock).toStrictEqual({ uuid: 'folder-uuid' });
    call(aesDecryptMock).toStrictEqual(['encrypted-name', 'crypto-key-10']);
    expect(result).toStrictEqual({ data: expectedSnapshot });
  });
});
