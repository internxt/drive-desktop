import { act, renderHook } from '@testing-library/react-hooks';
import { useUserAvailableProducts } from './useUserAvailableProducts';

declare global {
  interface Window {
    electron: {
      userAvailableProducts: {
        get: () => Promise<any>;
        subscribe: () => void;
        onUpdate: (callback: (data: any) => void) => () => void;
      };
    };
  }
}

const mockGet = jest.fn();
const mockSubscribe = jest.fn();
const mockOnUpdate = jest.fn();
const mockListener = jest.fn();

beforeAll(() => {
  const originalElectron = window.electron;

  window.electron = {
    userAvailableProducts: {
      get: mockGet,
      subscribe: mockSubscribe,
      onUpdate: mockOnUpdate,
    },
  };

  return () => {
    if (originalElectron) {
      window.electron = originalElectron;
    } else {
      // @ts-ignore (to avoid TypeScript complaints about deleting a required property)
      delete window.electron;
    }
  };
});

describe('useUserAvailableProducts', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    const products = {
      backups: true,
      antivirus: false,
    };

    mockGet.mockResolvedValue(products);
    mockOnUpdate.mockReturnValue(mockListener);
  });

  it('should initialize with undefined products', () => {
    const { result } = renderHook(() => useUserAvailableProducts());

    expect(result.current.products).toBeUndefined();
  });

  it('should fetch products on mount', async () => {
    const mockProducts = {
      backups: true,
      antivirus: false,
    };
    mockGet.mockResolvedValue(mockProducts);

    const { result, waitForNextUpdate } = renderHook(() => useUserAvailableProducts());

    await waitForNextUpdate();

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result.current.products).toEqual(mockProducts);
  });

  it('should subscribe to product updates on mount', async () => {
    renderHook(() => useUserAvailableProducts());

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('should register update listener on mount', async () => {
    renderHook(() => useUserAvailableProducts());

    expect(mockOnUpdate).toHaveBeenCalledTimes(1);
    expect(mockOnUpdate).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should update products when listener is triggered', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useUserAvailableProducts());

    await waitForNextUpdate();

    const updateCallback = mockOnUpdate.mock.calls[0][0];

    const updatedProducts = {
      backups: true,
      antivirus: true,
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
    mockGet.mockRejectedValue(error);

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useUserAvailableProducts());


    expect(result.current.products).toBeUndefined();


    consoleErrorSpy.mockRestore();
  });
});
