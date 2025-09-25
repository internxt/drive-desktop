import { mockProps } from '@/tests/vitest/utils.helper.test';
import { isHydrationPending } from './is-hydration-pending';
import { PinState } from '@/node-win/types/placeholder.type';

describe('is-hydration-pending', () => {
  let props: Parameters<typeof isHydrationPending>[0];

  beforeEach(() => {
    props = mockProps<typeof isHydrationPending>({
      pinState: PinState.AlwaysLocal,
      stats: {
        blocks: 2,
        size: 8 * 512,
      },
    });
  });

  it('should return false if pinState not AlwaysLocal', () => {
    // Given
    props.pinState = PinState.OnlineOnly;
    // When
    const res = isHydrationPending(props);
    // Then
    expect(res).toBe(false);
  });

  it('should return false if blocks match size', () => {
    // Given
    props.stats.blocks = 8;
    // When
    const res = isHydrationPending(props);
    // Then
    expect(res).toBe(false);
  });

  it('should return false if blocks are more than size', () => {
    // Given
    props.stats.blocks = 9;
    // When
    const res = isHydrationPending(props);
    // Then
    expect(res).toBe(false);
  });

  it('should return true if blocks are less than size', () => {
    // Given
    props.stats.blocks = 7;
    // When
    const res = isHydrationPending(props);
    // Then
    expect(res).toBe(true);
  });
});
