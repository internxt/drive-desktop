import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react-hooks';
import { useOnlineStatus } from './useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('should return true when online', async () => {

     vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);

    const { result } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(true);
  });

  it('should return false when offline', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(false);

    const { result, waitForNextUpdate } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();

    expect(result.current).toBe(false);
  });

  it('should return true when online after being offline', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(false);

    const { rerender, result, waitForNextUpdate } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();
    expect(result.current).toBe(false);

     vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);
    rerender();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    await waitForNextUpdate();

    expect(result.current).toBe(true);
  });

  it('should use navigator.onLine as fallback if checkInternetConnection fails', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockRejectedValue(new Error('IPC failed'));

    // Mock navigator.onLine to return false
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    const { result, waitForNextUpdate } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();

    expect(result.current).toBe(false);
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerMock = vi.spyOn(window, 'addEventListener');
    const removeEventListenerMock = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus(1000));

    expect(addEventListenerMock).toHaveBeenCalledWith('online', expect.any(Function));
    expect(addEventListenerMock).toHaveBeenCalledWith('offline', expect.any(Function));

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith('online', expect.any(Function));
    expect(removeEventListenerMock).toHaveBeenCalledWith('offline', expect.any(Function));
  });

  it('should respect the custom interval time', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);

    const INTERVAL = 5000;
    renderHook(() => useOnlineStatus(INTERVAL));

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(window.electron.checkInternetConnection).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(window.electron.checkInternetConnection).toHaveBeenCalledTimes(2);
  });

  it('should update state only when checkInternetConnection returns a different value', async () => {
    vi.mocked(window.electron.checkInternetConnection).mockResolvedValue(true);

    const { result } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(window.electron.checkInternetConnection).toHaveBeenCalledTimes(4);
    expect(result.current).toBe(true);
  });
});
