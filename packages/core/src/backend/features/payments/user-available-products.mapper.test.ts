import { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';

import { mockProps } from '@/tests/vitest/utils.helper.test';

import { userAvailableProductsMapper } from './user-available-products.mapper';

describe('userAvailableProductsMapper', () => {
  it('should correctly map an object of Tier["featuresPerService"] into the proper domain object', () => {
    const props = mockProps<typeof userAvailableProductsMapper>({
      backups: { enabled: true },
      antivirus: { enabled: false },
      cleaner: { enabled: true },
    });

    const result = userAvailableProductsMapper(props);

    expect(result).toStrictEqual({
      backups: true,
      antivirus: false,
      cleaner: true,
    });
  });

  it('should correctly map into the proper domain object even though we recieve incorrect properties', () => {
    const props = mockProps<typeof userAvailableProductsMapper>({
      antivirus: { enabled: null } as unknown as Tier['featuresPerService']['antivirus'],
      backups: { enabled: true },
    });

    const result = userAvailableProductsMapper(props);

    expect(result).toStrictEqual({
      backups: true,
      antivirus: false,
      cleaner: false,
    });
  });
});
