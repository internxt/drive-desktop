import { aes, stringUtils } from '@internxt/lib';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { validateMnemonic } from 'bip39';
import { Notification, clipboard } from 'electron';
import { DriveServerError } from '../../../../infra/drive-server/drive-server.error';
import * as fetchFileMetaByPathModule from '../../../../infra/drive-server/services/files/services/fetch-file-meta-by-path';
import * as fetchFolderMetaByPathModule from '../../../../infra/drive-server/services/folder/services/fetch-folder-meta-by-path';
import * as createSharingModule from '../../../../infra/drive-server/services/sharings/services/create-sharing';
import * as fetchPublicSharingDomainsModule from '../../../../infra/drive-server/services/sharings/services/fetch-public-sharing-domains';
import * as getCredentialsModule from '../../../../apps/main/auth/get-credentials';
import { generateLink } from './generate-link';
import { call, calls, partialSpyOn } from 'tests/vitest/utils.helper';

vi.mock('bip39', () => ({
  validateMnemonic: vi.fn(),
}));

describe('generate-link', () => {
  const getCredentialsMock = partialSpyOn(getCredentialsModule, 'getCredentials');
  const fetchFileMetaByPathMock = partialSpyOn(fetchFileMetaByPathModule, 'fetchFileMetaByPath');
  const fetchFolderMetaByPathMock = partialSpyOn(fetchFolderMetaByPathModule, 'fetchFolderMetaByPath');
  const fetchPublicSharingDomainsMock = partialSpyOn(fetchPublicSharingDomainsModule, 'fetchPublicSharingDomains');
  const createSharingMock = partialSpyOn(createSharingModule, 'createSharing');
  const loggerDebugMock = partialSpyOn(logger, 'debug');
  const clipboardWriteTextMock = partialSpyOn(clipboard, 'writeText');
  const notificationShowMock = partialSpyOn(Notification, 'show');

  const validateMnemonicMock = vi.mocked(validateMnemonic);
  const encryptMock = partialSpyOn(aes, 'encrypt');
  const decryptMock = partialSpyOn(aes, 'decrypt');
  const generateRandomStringUrlSafeMock = partialSpyOn(stringUtils, 'generateRandomStringUrlSafe');
  const encodeV4UuidMock = partialSpyOn(stringUtils, 'encodeV4Uuid');

  beforeEach(() => {
    getCredentialsMock.mockReturnValue({ newToken: 'token', mnemonic: 'valid mnemonic' });
    validateMnemonicMock.mockReturnValue(true);
    generateRandomStringUrlSafeMock.mockReturnValue('plain-code');
    encryptMock.mockReturnValueOnce('encrypted-mnemonic').mockReturnValueOnce('encrypted-code');
    decryptMock.mockReturnValue('recovered-code');
    encodeV4UuidMock.mockReturnValue('encoded-sharing-id');
  });

  it('should create a public sharing link for a file path and copy it to clipboard', async () => {
    fetchFileMetaByPathMock.mockResolvedValueOnce({ data: { uuid: 'file-uuid' } } as object);
    fetchPublicSharingDomainsMock.mockResolvedValueOnce({ data: { list: ['https://share.internxt.test'] } } as object);
    createSharingMock.mockResolvedValueOnce({
      data: {
        encryptedCode: 'server-encrypted-code',
        id: '08dfcc54-16d6-4f9d-9124-8a36b12e07dd',
      },
    } as object);

    const result = await generateLink({ path: '/folder/file.txt' });

    expect(result).toStrictEqual({ data: 'https://share.internxt.test/sh/file/encoded-sharing-id/recovered-code' });
    call(fetchFileMetaByPathMock).toStrictEqual({ path: '/folder/file.txt' });
    call(fetchPublicSharingDomainsMock).toStrictEqual([]);
    call(createSharingMock).toStrictEqual({
      body: {
        encryptedCode: 'encrypted-code',
        encryptedPassword: null,
        encryptionAlgorithm: 'inxt-v2',
        encryptionKey: 'encrypted-mnemonic',
        itemId: 'file-uuid',
        itemType: 'file',
        persistPreviousSharing: true,
      },
    });
    call(clipboardWriteTextMock).toBe('https://share.internxt.test/sh/file/encoded-sharing-id/recovered-code');
    calls(notificationShowMock).toHaveLength(1);
    call(loggerDebugMock).toMatchObject({
      msg: 'link copied',
      itemType: 'file',
      path: '/folder/file.txt',
    });
  });

  it('should fallback to folder metadata when file metadata is not found', async () => {
    fetchFileMetaByPathMock.mockResolvedValueOnce({ error: new DriveServerError('NOT_FOUND', 404) } as object);
    fetchFolderMetaByPathMock.mockResolvedValueOnce({ data: { uuid: 'folder-uuid' } } as object);
    fetchPublicSharingDomainsMock.mockResolvedValueOnce({ data: { list: ['https://share.internxt.test'] } } as object);
    createSharingMock.mockResolvedValueOnce({
      data: {
        encryptedCode: 'server-encrypted-code',
        id: '08dfcc54-16d6-4f9d-9124-8a36b12e07dd',
      },
    } as object);

    const result = await generateLink({ path: '/folder' });

    expect(result).toStrictEqual({ data: 'https://share.internxt.test/sh/folder/encoded-sharing-id/recovered-code' });
    call(fetchFileMetaByPathMock).toStrictEqual({ path: '/folder' });
    call(fetchFolderMetaByPathMock).toStrictEqual({ path: '/folder' });
  });

  it('should fail before any network call when mnemonic is invalid', async () => {
    validateMnemonicMock.mockReturnValue(false);

    await expect(generateLink({ path: '/folder/file.txt' })).resolves.toMatchObject({
      error: new Error('The user mnemonic is invalid'),
    });

    calls(fetchFileMetaByPathMock).toHaveLength(0);
    calls(fetchFolderMetaByPathMock).toHaveLength(0);
    calls(fetchPublicSharingDomainsMock).toHaveLength(0);
    calls(createSharingMock).toHaveLength(0);
    calls(clipboardWriteTextMock).toHaveLength(0);
    calls(notificationShowMock).toHaveLength(0);
  });
});
