import { clipboard } from 'electron';
import { logger } from '@/apps/shared/logger/logger';
import { call } from '@/tests/vitest/utils.helper.test';
import { copyShareLinkToClipboard } from './copy-share-link-to-clipboard';

describe('copyShareLinkToClipboard', () => {
  const writeTextMock = vi.mocked(clipboard.writeText);

  it('should copy the link to the system clipboard', () => {
    const result = copyShareLinkToClipboard('https://share.eu.internxt.com/sh/file/id/code');

    expect(result).toBe(true);
    call(writeTextMock).toStrictEqual('https://share.eu.internxt.com/sh/file/id/code');
    expect(logger.debug).toHaveBeenCalledWith({ msg: 'Public share link copied to clipboard' });
  });

  it('should return false and log when copying fails', () => {
    const error = new Error('Clipboard unavailable');
    writeTextMock.mockImplementationOnce(() => {
      throw error;
    });

    const result = copyShareLinkToClipboard('https://share.eu.internxt.com/sh/file/id/code');

    expect(result).toBe(false);
    expect(logger.error).toHaveBeenCalledWith({
      msg: 'Error copying share link to clipboard',
      error,
    });
  });
});
