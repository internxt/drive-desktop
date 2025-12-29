import { mockProps, partialSpyOn } from '@/tests/vitest/utils.helper.test';
import { debounceOnRaw, timeouts } from './debounce-on-raw';
import { abs } from '@/context/local/localFile/infrastructure/AbsolutePath';
import * as onChange from './on-change';

describe('debounce-on-raw', () => {
  const onChangeMock = partialSpyOn(onChange, 'onChange');

  const path = abs('path');
  let props: Parameters<typeof debounceOnRaw>[0];

  beforeEach(() => {
    vi.useFakeTimers();
    timeouts.clear();
    props = mockProps<typeof debounceOnRaw>({ path });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not call it until 2s', () => {
    // When
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(1999);
    expect(onChangeMock).toBeCalledTimes(0);
    expect(timeouts.has(path)).toBe(true);
  });

  it('should call it after 2s', () => {
    // When
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onChangeMock).toBeCalledTimes(1);
    expect(timeouts.size).toBe(0);
  });

  it('should call just once if key is the same', () => {
    // When
    debounceOnRaw(props);
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onChangeMock).toBeCalledTimes(1);
    expect(timeouts.size).toBe(0);
  });

  it('should call just twice if key is different', () => {
    // When
    debounceOnRaw(props);
    props.path = abs('anotherPath');
    debounceOnRaw(props);
    // Then
    vi.advanceTimersByTime(2000);
    expect(onChangeMock).toBeCalledTimes(2);
    expect(timeouts.size).toBe(0);
  });
});
