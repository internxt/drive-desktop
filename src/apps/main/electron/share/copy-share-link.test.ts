import { clipboard, Notification } from 'electron';
import { logger } from '@/apps/shared/logger/logger';
import { call, calls } from '@/tests/vitest/utils.helper.test';
import { copyShareLinkToClipboard, copyTextToClipboard, showShareResultNotification } from './copy-share-link';

describe('copy share link', () => {
  const NotificationMock = vi.mocked(Notification);
  const writeTextMock = vi.mocked(clipboard.writeText);
  const mockShow = vi.fn();
  const mockOn = vi.fn();

  beforeEach(() => {
    NotificationMock.mockImplementation(
      class {
        constructor() {
          return { show: mockShow, on: mockOn };
        }
      } as unknown as typeof Notification,
    );
  });

  it('copies text to the system clipboard', () => {
    copyTextToClipboard('https://drive.internxt.com/shared/example');

    call(writeTextMock).toStrictEqual('https://drive.internxt.com/shared/example');
  });

  it('shows the success notification', () => {
    showShareResultNotification('success');

    call(NotificationMock).toMatchObject({
      title: 'Internxt',
      body: 'Link copied to clipboard',
    });
    calls(mockShow).toHaveLength(1);
    calls(mockOn).toHaveLength(1);
  });

  it('reports success after copying a share link', () => {
    const result = copyShareLinkToClipboard('https://drive.internxt.com/shared/example');

    expect(result).toBe(true);
    call(writeTextMock).toStrictEqual('https://drive.internxt.com/shared/example');
    call(NotificationMock).toMatchObject({ body: 'Link copied to clipboard' });
  });

  it('shows an error notification when copying fails', () => {
    const error = new Error('Clipboard unavailable');
    writeTextMock.mockImplementationOnce(() => {
      throw error;
    });

    const result = copyShareLinkToClipboard('https://drive.internxt.com/shared/example');

    expect(result).toBe(false);
    call(NotificationMock).toMatchObject({ body: 'Error sharing item, try again later.' });
    expect(logger.error).toHaveBeenCalledWith({ msg: 'Error copying share link to clipboard', error });
  });
});
