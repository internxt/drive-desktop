import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import * as createSharingModule from '../../../../infra/drive-server/services/sharings/services/create-sharing';
import { createSharingResult } from './create-sharing-result';
import { call, partialSpyOn } from 'tests/vitest/utils.helper';

describe('create-sharing-result', () => {
  const createSharingMock = partialSpyOn(createSharingModule, 'createSharing');

  beforeEach(() => {
    createSharingMock.mockResolvedValue({
      data: {
        encryptedCode: 'server-encrypted-code',
        id: 'sharing-id',
      },
    } as object);
  });

  it('should call createSharing with expected payload and return sharing data', async () => {
    const result = await createSharingResult({
      encryptedCode: 'local-encrypted-code',
      encryptionKey: 'encrypted-mnemonic',
      item: {
        itemId: 'file-uuid',
        itemType: 'file',
      },
    });

    call(createSharingMock).toStrictEqual({
      body: {
        encryptedCode: 'local-encrypted-code',
        encryptedPassword: null,
        encryptionAlgorithm: 'inxt-v2',
        encryptionKey: 'encrypted-mnemonic',
        itemId: 'file-uuid',
        itemType: 'file',
        persistPreviousSharing: true,
      },
    });

    expect(result).toStrictEqual({
      encryptedCode: 'server-encrypted-code',
      id: 'sharing-id',
    });
  });

  it('should throw transformed error when createSharing returns error', async () => {
    createSharingMock.mockResolvedValue({ error: new DriveServerError('NOT_FOUND', 404, 'not found') } as object);

    await expect(
      createSharingResult({
        encryptedCode: 'local-encrypted-code',
        encryptionKey: 'encrypted-mnemonic',
        item: {
          itemId: 'folder-uuid',
          itemType: 'folder',
        },
      }),
    ).rejects.toThrow('Error while creating sharing: not found');
  });
});
