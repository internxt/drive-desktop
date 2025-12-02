import { vi } from 'vitest';
import { act, renderHook } from '@testing-library/react-hooks';
import { useUserAvailableProducts } from './useUserAvailableProducts';

const mockListener = vi.fn();

describe('useUserAvailableProducts', () => {
  const mockProducts = {
    backups: true,
    antivirus: false,
    cleaner: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(window.electron.userAvailableProducts.get).mockResolvedValue(undefined);
    vi.mocked(window.electron.userAvailableProducts.onUpdate).mockReturnValue(mockListener);
  });

  it('should initialize with undefined products', () => {
    const { result } = renderHook(() => useUserAvailableProducts());

    expect(result.current.products).toBeUndefined();
  });

  it('should fetch products on mount', async () => {
    vi.mocked(window.electron.userAvailableProducts.get).mockResolvedValue(mockProducts);

    const { result, waitForNextUpdate } = renderHook(() => useUserAvailableProducts());

    await waitForNextUpdate();

    expect(window.electron.userAvailableProducts.get).toHaveBeenCalledTimes(1);
    expect(result.current.products).toEqual(mockProducts);
  });

  it('should subscribe to product updates on mount', async () => {
    renderHook(() => useUserAvailableProducts());

    expect(window.electron.userAvailableProducts.subscribe).toHaveBeenCalledTimes(1);
  });

  it('should register update listener on mount', async () => {
    renderHook(() => useUserAvailableProducts());

    expect(window.electron.userAvailableProducts.onUpdate).toHaveBeenCalledTimes(1);
    expect(window.electron.userAvailableProducts.onUpdate).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update products when listener is triggered', async () => {
    vi.mocked(window.electron.userAvailableProducts.get).mockResolvedValue(mockProducts);

    const { result, waitForNextUpdate } = renderHook(() => useUserAvailableProducts());

    await waitForNextUpdate();

    const updateCallback = vi.mocked(window.electron.userAvailableProducts.onUpdate).mock.calls[0][0];

    const updatedProducts = {
      backups: true,
      antivirus: true,
      cleaner: false,
    };

    act(() => {
      updateCallback(updatedProducts);
    });

    expect(result.current.products).toEqual(updatedProducts);
  });

  it('should return cleanup function that calls the listener', () => {
    const { unmount } = renderHook(() => useUserAvailableProducts());

    // Unmount the hook to trigger cleanup
    unmount();

    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  it('should handle errors when fetching products', async () => {
    const error = new Error('Failed to fetch products');
    vi.mocked(window.electron.userAvailableProducts.get).mockRejectedValue(error);

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useUserAvailableProducts());

    // Wait for the promise to reject and be handled
    await vi.waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch user available products:', error);
    });

    expect(result.current.products).toBeUndefined();

    consoleErrorSpy.mockRestore();
  });
});
