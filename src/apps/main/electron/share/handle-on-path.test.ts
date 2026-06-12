import { logger } from '@/apps/shared/logger/logger';
import { copyShareLinkToClipboard } from './copy-share-link-to-clipboard';
import { createPublicShareLink } from './create-public-share-link';
import { handleOnPath } from './handle-on-path';
import { resolveContextMenuItem } from './resolve-context-menu-item';
import { showShareResultNotification } from './show-share-result-notification';

vi.mock(import('./copy-share-link-to-clipboard'));
vi.mock(import('./show-share-result-notification'));
vi.mock(import('./create-public-share-link'));
vi.mock(import('./resolve-context-menu-item'));

describe('handleOnPath', () => {
  const selection = {
    item: { type: 'file' as const, uuid: 'file-uuid' },
    ctx: { workspaceId: '' },
  };

  it('should create and copy a public share link', async () => {
    vi.mocked(resolveContextMenuItem).mockResolvedValue(selection as never);
    vi.mocked(createPublicShareLink).mockResolvedValue({
      data: 'https://share.eu.internxt.com/sh/file/id/code',
    });
    vi.mocked(copyShareLinkToClipboard).mockReturnValue(true);

    await handleOnPath(String.raw`C:\InternxtDrive\document.pdf`);

    expect(createPublicShareLink).toHaveBeenCalledWith(selection);
    expect(copyShareLinkToClipboard).toHaveBeenCalledWith('https://share.eu.internxt.com/sh/file/id/code');
    expect(showShareResultNotification).toHaveBeenCalledWith('success');
  });

  it('should show an error notification when link creation returns an error', async () => {
    const error = new Error('Sharing failed');
    vi.mocked(resolveContextMenuItem).mockResolvedValue(selection as never);
    vi.mocked(createPublicShareLink).mockResolvedValue({ error });

    await handleOnPath(String.raw`C:\InternxtDrive\document.pdf`);

    expect(copyShareLinkToClipboard).not.toHaveBeenCalled();
    expect(showShareResultNotification).toHaveBeenCalledWith('error');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: 'Error creating public share link from context menu',
        error,
      }),
    );
  });

  it('should show an error notification when copying the link fails', async () => {
    vi.mocked(resolveContextMenuItem).mockResolvedValue(selection as never);
    vi.mocked(createPublicShareLink).mockResolvedValue({
      data: 'https://share.eu.internxt.com/sh/file/id/code',
    });
    vi.mocked(copyShareLinkToClipboard).mockReturnValue(false);

    await handleOnPath(String.raw`C:\InternxtDrive\document.pdf`);

    expect(showShareResultNotification).toHaveBeenCalledWith('error');
  });

  it('should do nothing when the selected path cannot be resolved', async () => {
    vi.mocked(resolveContextMenuItem).mockResolvedValue(null);

    await handleOnPath(String.raw`C:\Outside\document.pdf`);

    expect(createPublicShareLink).not.toHaveBeenCalled();
    expect(copyShareLinkToClipboard).not.toHaveBeenCalled();
  });
});
