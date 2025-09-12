import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { areProductsEqual } from './are-products-equal';

describe('areProductsEqual', () => {
  it('should return false when stored is undefined', () => {
    const result = areProductsEqual({
      stored: undefined,
      fetched: { backups: true, antivirus: false, cleaner: true },
    });

    expect(result).toBe(false);
  });

  it('should return true when all products are equal', () => {
    const stored = { backups: true, antivirus: false, cleaner: true };
    const fetched = { backups: true, antivirus: false, cleaner: true };

    const result = areProductsEqual({ stored, fetched });

    expect(result).toBe(true);
  });

  it('should return false when backups differ', () => {
    const stored = { backups: true, antivirus: false, cleaner: true };
    const fetched = { backups: false, antivirus: false, cleaner: true };

    const result = areProductsEqual({ stored, fetched });

    expect(result).toBe(false);
  });

  it('should return false when antivirus differ', () => {
    const stored = { backups: true, antivirus: false, cleaner: true };
    const fetched = { backups: true, antivirus: true, cleaner: true };

    const result = areProductsEqual({ stored, fetched });

    expect(result).toBe(false);
  });

  it('should return false when cleaner differ', () => {
    const stored = { backups: true, antivirus: false, cleaner: true };
    const fetched = { backups: true, antivirus: false, cleaner: false };

    const result = areProductsEqual({ stored, fetched });

    expect(result).toBe(false);
  });

  it('should return false when multiple products differ', () => {
    const stored = { backups: true, antivirus: false, cleaner: true };
    const fetched = { backups: false, antivirus: true, cleaner: false };

    const result = areProductsEqual({ stored, fetched });

    expect(result).toBe(false);
  });

  it('should handle missing properties gracefully', () => {
    const stored = {
      backups: true,
      antivirus: false,
    } as unknown as UserAvailableProducts;
    const fetched = { backups: true, antivirus: false, cleaner: true };

    const result = areProductsEqual({ stored, fetched });

    expect(result).toBe(false);
  });
});
