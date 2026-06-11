import { act, renderHook } from '@testing-library/react-hooks';
import { useMarketingNotifications } from './useMarketingNotifications';

const notificationInstances: Array<{
  title: string;
  options?: NotificationOptions;
  onclick: ((event: Event) => void) | null;
}> = [];

const NotificationMock = vi.fn(function NotificationMock(
  this: { title: string; options?: NotificationOptions; onclick: ((event: Event) => void) | null },
  title: string,
  options?: NotificationOptions,
) {
  this.title = title;
  this.options = options;
  this.onclick = null;
  notificationInstances.push(this);
});

const notification = {
  id: 'notification-id',
  link: 'https://internxt.com/promo',
  message: 'Promo message',
  expiresAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  isRead: false,
  deliveredAt: '2024-01-01T00:00:00.000Z',
  readAt: null,
};

describe('useMarketingNotifications', () => {
  beforeEach(() => {
    notificationInstances.length = 0;
    vi.mocked(window.electron.onMarketingNotifications).mockReturnValue(vi.fn());
    vi.mocked(window.electron.openUrl).mockResolvedValue(undefined);
    vi.stubGlobal('Notification', NotificationMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should subscribe to marketing notifications and clean up on unmount', () => {
    const removeListener = vi.fn();
    vi.mocked(window.electron.onMarketingNotifications).mockReturnValue(removeListener);

    const { unmount } = renderHook(() => useMarketingNotifications());

    expect(window.electron.onMarketingNotifications).toHaveBeenCalledWith(expect.any(Function));

    unmount();

    expect(removeListener).toHaveBeenCalledOnce();
  });

  it('should show a native notification for each marketing notification', () => {
    renderHook(() => useMarketingNotifications());
    const listener = vi.mocked(window.electron.onMarketingNotifications).mock.calls[0][0];

    act(() => {
      listener([notification]);
    });

    expect(NotificationMock).toHaveBeenCalledWith(
      'Internxt Drive',
      expect.objectContaining({
        body: 'Promo message',
        icon: expect.stringContaining('256x256.png'),
      }),
    );
  });

  it('should open the marketing link when the notification is clicked', async () => {
    renderHook(() => useMarketingNotifications());
    const listener = vi.mocked(window.electron.onMarketingNotifications).mock.calls[0][0];

    act(() => {
      listener([notification]);
    });

    await notificationInstances[0].onclick?.(new Event('click'));

    expect(window.electron.openUrl).toHaveBeenCalledWith('https://internxt.com/promo');
  });

  it('should not open non-https notification links', async () => {
    renderHook(() => useMarketingNotifications());
    const listener = vi.mocked(window.electron.onMarketingNotifications).mock.calls[0][0];

    act(() => {
      listener([{ ...notification, link: 'internxt://notification/promo' }]);
    });

    await notificationInstances[0].onclick?.(new Event('click'));

    expect(window.electron.openUrl).not.toHaveBeenCalled();
    expect(window.electron.logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        msg: '[RENDERER] Error opening marketing notification link',
        link: 'internxt://notification/promo',
      }),
    );
  });
});
