import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { debounceOnRaw, timeouts } from './debounce-on-raw';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as onRaw from './on-raw.service';

describe('debounce-on-raw', () => {
  const onRawMock = partialSpyOn(onRaw, 'onRaw');

  let props: Parameters<typeof debounceOnRaw>[0];

  beforeEach(() => {
    vi.useFakeTimers();
    timeouts.clear();
    props = mockProps<typeof debounceOnRaw>({ event: 'change', absolutePath: 'absolutePath' as AbsolutePath });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call it until 2s', () => {
    // When
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(1999);
    expect(onRawMock).toBeCalledTimes(0);
    expect(timeouts.has('change:absolutePath')).toBe(true);
  });

  it('should call it after 2s', () => {
    // When
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onRawMock).toBeCalledTimes(1);
    expect(timeouts.size).toBe(0);
  });

  it('should call just once if key is the same', () => {
    // When
    debounceOnRaw(props);
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onRawMock).toBeCalledTimes(1);
    expect(timeouts.size).toBe(0);
  });

  it('should call just twice if key is different', () => {
    // When
    debounceOnRaw(props);
    props.absolutePath = 'anotherPath' as AbsolutePath;
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onRawMock).toBeCalledTimes(2);
    expect(timeouts.size).toBe(0);
  });
});
