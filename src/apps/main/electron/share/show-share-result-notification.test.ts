import { Notification } from 'electron';
import { getLanguage } from '@/apps/main/config/language';
import { logger } from '@/apps/shared/logger/logger';
import { call, calls } from '@/tests/vitest/utils.helper.test';
import { NOTIFICATION_TITLE } from './constants';
import { showShareResultNotification } from './show-share-result-notification';

vi.mock(import('@/apps/main/config/language'));

describe('showShareResultNotification', () => {
  const NotificationMock = vi.mocked(Notification);
  const mockShow = vi.fn();
  const mockOn = vi.fn();

  beforeEach(() => {
    vi.mocked(getLanguage).mockReturnValue('en');
    NotificationMock.mockImplementation(
      class {
        constructor() {
          return { show: mockShow, on: mockOn };
        }
      } as unknown as typeof Notification,
    );
  });

  it('should show the success notification', () => {
    showShareResultNotification('success');

    call(NotificationMock).toMatchObject({
      title: NOTIFICATION_TITLE,
      body: 'Link copied to clipboard',
    });
    calls(mockShow).toHaveLength(1);
    calls(mockOn).toHaveLength(1);
  });

  it('should show the error notification', () => {
    showShareResultNotification('error');

    call(NotificationMock).toMatchObject({
      title: NOTIFICATION_TITLE,
      body: 'Error sharing item, try again later.',
    });
    calls(mockShow).toHaveLength(1);
  });

  it('should use the selected application language', () => {
    vi.mocked(getLanguage).mockReturnValue('es');

    showShareResultNotification('success');

    call(NotificationMock).toMatchObject({
      title: NOTIFICATION_TITLE,
      body: 'Enlace copiado al portapapeles',
    });
  });

  it('should log when the notification fails', () => {
    showShareResultNotification('error');
    const failedHandler = mockOn.mock.calls[0][1];
    const error = new Error('Notification unavailable');

    failedHandler(error);

    expect(logger.error).toHaveBeenCalledWith({
      msg: 'Share result notification failed',
      body: 'Error sharing item, try again later.',
      error,
    });
  });
});
