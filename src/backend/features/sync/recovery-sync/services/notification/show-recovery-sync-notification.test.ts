import { Notification, shell } from 'electron';
import { getLanguage } from '@/apps/main/config/language';
import { call } from '@/tests/vitest/utils.helper.test';
import { getRecoverySyncNotificationText, showRecoverySyncNotification } from './show-recovery-sync-notification';

vi.mock(import('@/apps/main/config/language'));

describe('show-recovery-sync-notification', () => {
  const NotificationMock = vi.mocked(Notification);
  const showMock = vi.fn();
  const onMock = vi.fn();

  beforeEach(() => {
    vi.mocked(getLanguage).mockReturnValue('en');
    NotificationMock.mockImplementation(
      class {
        constructor() {
          return { show: showMock, on: onMock };
        }
      } as unknown as typeof Notification,
    );
  });

  it('should name the moved items and their folder when the run completed', () => {
    // When
    const { title, body } = getRecoverySyncNotificationText({ status: 'completed', preserved: 3, destinations: ['C:/Recovery'] });
    // Then
    expect(title).toBe('Recovery sync completed');
    expect(body).toContain(String.raw`We moved 3 items that are no longer in your cloud storage, or are in its trash, to C:\Recovery.`);
  });

  it('should say nothing was moved when the run completed without moves', () => {
    // When
    const { body } = getRecoverySyncNotificationText({ status: 'completed', preserved: 0, destinations: [] });
    // Then
    expect(body).toBe('Your Internxt Drive folder matches your cloud storage, no files had to be moved.');
  });

  it('should point to the issues and still name the moved items when the run failed', () => {
    // When
    const { title, body } = getRecoverySyncNotificationText({ status: 'failed', preserved: 1, destinations: ['C:/A', 'D:/B'] });
    // Then
    expect(title).toBe('Recovery sync could not finish');
    expect(body).toMatch(/^Some items could not be recovered, check the sync issues in the app\. We moved 1 items .* to C:\\A, D:\\B\./);
  });

  it('should say the run was cancelled', () => {
    // When
    const { title, body } = getRecoverySyncNotificationText({ status: 'cancelled', preserved: 0, destinations: [] });
    // Then
    expect(title).toBe('Recovery sync was cancelled');
    expect(body).toBe('Recovery sync stopped before finishing.');
  });

  it('should open the first recovery folder when the notification is clicked', () => {
    // Given
    const openPathMock = vi.mocked(shell.openPath);
    // When
    showRecoverySyncNotification({ status: 'completed', preserved: 1, destinations: ['C:/Recovery'] });
    onMock.mock.calls.find(([event]) => event === 'click')?.[1]();
    // Then
    expect(showMock).toHaveBeenCalledOnce();
    call(openPathMock).toBe(String.raw`C:\Recovery`);
  });

  it('should not handle clicks when nothing was moved', () => {
    // When
    showRecoverySyncNotification({ status: 'completed', preserved: 0, destinations: [] });
    // Then
    expect(onMock.mock.calls.map(([event]) => event)).toStrictEqual(['failed']);
  });
});
