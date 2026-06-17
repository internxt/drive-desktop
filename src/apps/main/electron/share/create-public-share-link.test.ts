import { createShareClient } from '@internxt/drive-desktop-core/build/backend/features/share-link';
import { aes, stringUtils } from '@internxt/lib';
import { obtainToken } from '@/apps/main/auth/service';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { createPublicShareLink } from './create-public-share-link';
import { INTERNXT_VERSION } from '../../../../core/utils/utils';

vi.mock(import('@internxt/drive-desktop-core/build/backend/features/share-link'));
vi.mock(import('@internxt/lib'));
vi.mock(import('@/apps/main/auth/service'));

describe('createPublicShareLink', () => {
  const createSharing = vi.fn();
  const getShareDomains = vi.fn();
  const ctx = {
    mnemonic: 'owner mnemonic',
    workspaceToken: 'workspace token',
  } as SyncContext;

  beforeEach(() => {
    vi.mocked(createShareClient).mockReturnValue({ createSharing, getShareDomains } as never);
    vi.mocked(obtainToken).mockReturnValue('user token');
    vi.mocked(stringUtils.generateRandomStringUrlSafe).mockReturnValue('plain-code');
    vi.mocked(stringUtils.encodeV4Uuid).mockReturnValue('encoded-sharing-id');
    vi.mocked(aes.encrypt).mockReturnValueOnce('encrypted-mnemonic').mockReturnValueOnce('encrypted-code');
    vi.mocked(aes.decrypt).mockReturnValue('decrypted-code');
    createSharing.mockResolvedValue({
      id: 'sharing-id',
      encryptedCode: 'encrypted-code-from-api',
    });

    getShareDomains.mockResolvedValue({
      list: ['https://share.eu.internxt.com', 'https://share.us.internxt.com'],
    });
  });

  it('should create the sharing and build its public URL using the first domain', async () => {
    const result = await createPublicShareLink({
      item: { type: 'file', uuid: 'file-uuid' as FileUuid },
      ctx,
    });

    expect(createShareClient).toHaveBeenCalledWith({
      apiUrl: process.env.DRIVE_URL,
      clientName: 'internxt-drive',
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
      token: 'user token',
      workspaceToken: 'workspace token',
    });

    expect(stringUtils.generateRandomStringUrlSafe).toHaveBeenCalledWith(8);
    expect(getShareDomains).toHaveBeenCalledOnce();
    expect(createSharing).toHaveBeenCalledWith({
      itemId: 'file-uuid',
      itemType: 'file',
      encryptionKey: 'encrypted-mnemonic',
      encryptionAlgorithm: 'inxt-v2',
      encryptedCode: 'encrypted-code',
      persistPreviousSharing: true,
    });
    expect(aes.decrypt).toHaveBeenCalledWith('encrypted-code-from-api', 'owner mnemonic');
    expect(result).toEqual({
      data: 'https://share.eu.internxt.com/sh/file/encoded-sharing-id/decrypted-code',
    });
  });

  it('should return an error when the API provides no share domain', async () => {
    getShareDomains.mockResolvedValue({ list: [] });

    const result = await createPublicShareLink({
      item: { type: 'folder', uuid: 'folder-uuid' as FolderUuid },
      ctx,
    });

    expect(result).toEqual({ error: new Error('No share domains available') });
    expect(createSharing).not.toHaveBeenCalled();
  });

  it('should return an error when creating the sharing fails', async () => {
    const error = new Error('API unavailable');
    createSharing.mockRejectedValue(error);

    const result = await createPublicShareLink({
      item: { type: 'file', uuid: 'file-uuid' as FileUuid },
      ctx,
    });

    expect(result).toEqual({ error });
  });
});
