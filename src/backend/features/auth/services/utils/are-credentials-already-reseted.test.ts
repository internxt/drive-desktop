import { areCredentialsAlreadyReseted } from './are-credentials-already-reseted';
import ConfigStore from '@/apps/main/config';
import { defaults } from '@/core/electron/store/defaults';

vi.mock('@/apps/main/config', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('areCredentialsAlreadyReseted', () => {
  const mockConfigStore = vi.mocked(ConfigStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true if credentials are already reset', () => {
    mockConfigStore.get.mockImplementation((field) => (defaults as any)[field]);

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(true);
    expect(mockConfigStore.get).toHaveBeenCalledWith('mnemonic');
    expect(mockConfigStore.get).toHaveBeenCalledWith('userData');
    expect(mockConfigStore.get).toHaveBeenCalledWith('bearerToken');
    expect(mockConfigStore.get).toHaveBeenCalledWith('bearerTokenEncrypted');
    expect(mockConfigStore.get).toHaveBeenCalledWith('newToken');
  });

  it('should return false if credentials are not reset', () => {
    mockConfigStore.get.mockImplementation((field) => {
      if (field === 'bearerToken') {
        return 'some-token';
      }
      return (defaults as any)[field];
    });

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(false);
  });

  it('should handle object comparison correctly', () => {
    mockConfigStore.get.mockImplementation((field) => {
      if (field === 'userData') {
        return { id: 1, name: 'user' };
      }
      return (defaults as any)[field];
    });

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(false);
  });

  it('should return true when object fields match defaults', () => {
    mockConfigStore.get.mockImplementation((field) => {
      if (field === 'userData') {
        return {};
      }
      return (defaults as any)[field];
    });

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(true);
  });
});
