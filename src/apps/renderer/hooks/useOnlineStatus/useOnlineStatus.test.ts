import { act, renderHook } from '@testing-library/react-hooks';
import { useOnlineStatus } from './useOnlineStatus';

describe('useOnlineStatus', () => {
  beforeAll(() => {
    global.window = global as any;

    global.window.electron = {
      checkInternetConnection: jest.fn().mockResolvedValue(true),
    } as unknown as typeof window.electron;
    global.window.addEventListener = jest.fn();
    global.window.removeEventListener = jest.fn();

    global.navigator = {
      onLine: false,
    } as unknown as Navigator;
  });

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('should return true when online', async () => {
    jest
      .spyOn(window.electron, 'checkInternetConnection')
      .mockResolvedValue(true);

    const { result } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current).toBe(true);
  });

  it('should return false when offline', async () => {
    jest
      .spyOn(window.electron, 'checkInternetConnection')
      .mockResolvedValue(false);

    const { result, waitForNextUpdate } = renderHook(() =>
      useOnlineStatus(1000)
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();

    expect(result.current).toBe(false);
  });

  it('should return true when online after being offline', async () => {
    const checkInternetConnectionMock = jest.spyOn(
      window.electron,
      'checkInternetConnection'
    );
    checkInternetConnectionMock.mockResolvedValue(false);

    const { rerender, result, waitForNextUpdate } = renderHook(() =>
      useOnlineStatus(1000)
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();
    expect(result.current).toBe(false);

    checkInternetConnectionMock.mockResolvedValue(true);
    rerender();

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    await waitForNextUpdate();

    expect(result.current).toBe(true);
  });

  it('should use navigator.onLine as fallback if checkInternetConnection fails', async () => {
    const checkInternetConnectionMock = jest.spyOn(
      window.electron,
      'checkInternetConnection'
    );

    checkInternetConnectionMock.mockRejectedValue(new Error('IPC failed'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useOnlineStatus(1000)
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitForNextUpdate();

    expect(result.current).toBe(false);
  });

  it('should clean up event listeners on unmount', () => {
    const addEventListenerMock = jest.spyOn(window, 'addEventListener');
    const removeEventListenerMock = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useOnlineStatus(1000));

    expect(addEventListenerMock).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(addEventListenerMock).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );

    unmount();

    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'online',
      expect.any(Function)
    );
    expect(removeEventListenerMock).toHaveBeenCalledWith(
      'offline',
      expect.any(Function)
    );
  });

  it('should respect the custom interval time', async () => {
    const checkInternetConnectionMock = jest.spyOn(
      window.electron,
      'checkInternetConnection'
    );
    checkInternetConnectionMock.mockResolvedValue(true);

    const INTERVAL = 5000;
    renderHook(() => useOnlineStatus(INTERVAL));

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    expect(checkInternetConnectionMock).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(checkInternetConnectionMock).toHaveBeenCalledTimes(2);
  });

  it('should update state only when checkInternetConnection returns a different value', async () => {
    const checkInternetConnectionMock = jest.spyOn(
      window.electron,
      'checkInternetConnection'
    );

    checkInternetConnectionMock.mockResolvedValue(true);

    const { result } = renderHook(() => useOnlineStatus(1000));

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(checkInternetConnectionMock).toHaveBeenCalledTimes(4);
    expect(result.current).toBe(true);
  });
});
