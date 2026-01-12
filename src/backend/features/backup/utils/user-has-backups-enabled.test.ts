import configStore from '../../../../apps/main/config';
import { userHasBackupsEnabled } from './user-has-backups-enabled';

vi.mock('../../../../apps/main/config', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('userHasBackupsEnabled', () => {
  const mockConfigStore = vi.mocked(configStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return true when backups are enabled for the user', () => {
    mockConfigStore.get.mockReturnValue({ backups: true });

    const result = userHasBackupsEnabled();

    expect(result).toBe(true);
    expect(mockConfigStore.get).toHaveBeenCalledWith('availableUserProducts');
  });

  it('should return false when backups are not enabled for the user', () => {
    mockConfigStore.get.mockReturnValue({ backups: false });

    const result = userHasBackupsEnabled();

    expect(result).toBe(false);
  });

  it('should return false when availableUserProducts is undefined or null', () => {
    mockConfigStore.get.mockReturnValue(undefined);

    const resultUndefined = userHasBackupsEnabled();

    expect(resultUndefined).toBe(false);

    mockConfigStore.get.mockReturnValue(null);

    const resultNull = userHasBackupsEnabled();

    expect(resultNull).toBe(false);
  });

  it('should return false when availableUserProducts.backups is undefined or null', () => {
    mockConfigStore.get.mockReturnValue({ backups: undefined });

    const resultUndefined = userHasBackupsEnabled();

    expect(resultUndefined).toBe(false);

    mockConfigStore.get.mockReturnValue({ backups: null });

    const resultNull = userHasBackupsEnabled();

    expect(resultNull).toBe(false);
  });

  it('should handle unexpected data types gracefully', () => {
    // Empty object
    mockConfigStore.get.mockReturnValue({});
    expect(userHasBackupsEnabled()).toBe(false);

    // backups is 0
    mockConfigStore.get.mockReturnValue({ backups: 0 });
    expect(userHasBackupsEnabled()).toBe(false);

    // backups is empty string
    mockConfigStore.get.mockReturnValue({ backups: '' });
    expect(userHasBackupsEnabled()).toBe(false);

    // backups is non-empty string (truthy)
    mockConfigStore.get.mockReturnValue({ backups: 'enabled' });
    expect(userHasBackupsEnabled()).toBe(true);

    // backups is an object (truthy)
    mockConfigStore.get.mockReturnValue({ backups: {} });
    expect(userHasBackupsEnabled()).toBe(true);
  });
});
