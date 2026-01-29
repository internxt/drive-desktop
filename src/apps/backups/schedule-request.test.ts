import { mockProps } from '@/tests/vitest/utils.helper.test';
import { scheduleRequest } from './schedule-request';
import { tracker } from '../main/background-processes/backups/BackupsProcessTracker/BackupsProcessTracker';
import Bottleneck from 'bottleneck';

describe('schedule-request', () => {
  let props: Parameters<typeof scheduleRequest>[0];

  const schedule = vi.fn();

  beforeEach(() => {
    tracker.reset();

    props = mockProps<typeof scheduleRequest>({
      ctx: { backupsBottleneck: { schedule } },
    });
  });

  it('should increment processed if bottleneck success', async () => {
    // Given
    schedule.mockResolvedValue(undefined);
    // When
    await scheduleRequest(props);
    // Then
    expect(tracker.current.processed).toBe(1);
  });

  it('should increment processed if bottleneck stops', async () => {
    // Given
    schedule.mockRejectedValue(new Bottleneck.BottleneckError('This limiter has been stopped.'));
    // When
    await scheduleRequest(props);
    // Then
    expect(tracker.current.processed).toBe(1);
  });

  it('should increment processed if bottleneck fails', async () => {
    // Given
    schedule.mockRejectedValue(new Error());
    // When
    const promise = scheduleRequest(props);
    // Then
    await expect(promise).rejects.toThrow();
    expect(tracker.current.processed).toBe(1);
  });
});
