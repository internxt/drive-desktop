import { areCredentialsAlreadyReseted } from './are-credentials-already-reseted';
import ConfigStore from '@/apps/main/config';
import { defaults } from '@/core/electron/store/defaults';
import { partialSpyOn } from '@/tests/vitest/utils.helper.test';

vi.mock(import('@/apps/main/config'));
describe('areCredentialsAlreadyReseted', () => {
  const mockConfigStore = partialSpyOn(ConfigStore, 'get');

  it('should return true if credentials are already reset', () => {
    mockConfigStore.mockImplementation((field) => defaults[field as keyof typeof defaults]);

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(true);
    expect(mockConfigStore).toHaveBeenCalledWith('mnemonic');
    expect(mockConfigStore).toHaveBeenCalledWith('userData');
    expect(mockConfigStore).toHaveBeenCalledWith('newToken');
  });

  it('should return false if credentials are not reset', () => {
    mockConfigStore.mockImplementation((field) => {
      if (field === 'newToken') {
        return 'some-token';
      }
      return defaults[field as keyof typeof defaults];
    });

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(false);
  });

  it('should handle object comparison correctly', () => {
    mockConfigStore.mockImplementation((field) => {
      if (field === 'userData') {
        return { id: 1, name: 'user' };
      }
      return defaults[field as keyof typeof defaults];
    });

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(false);
  });

  it('should return true when object fields match defaults', () => {
    mockConfigStore.mockImplementation((field) => {
      if (field === 'userData') {
        return {};
      }
      return defaults[field as keyof typeof defaults];
    });

    const result = areCredentialsAlreadyReseted();

    expect(result).toBe(true);
  });
});
