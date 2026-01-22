import { Payments } from '@internxt/sdk/dist/drive';
import { Tier } from '@internxt/sdk/dist/drive/payments/types/tiers';
import { mockDeep } from 'vitest-mock-extended';

import { logger } from '@/backend/core/logger/logger';
import { partialSpyOn, mockProps } from '@/tests/vitest/utils.helper.test';

import * as userAvailableProductsMapperFile from '../user-available-products.mapper';
import * as getPaymentsClientFile from './get-payments-client';
import { getUserAvailableProducts } from './get-user-available-products';

describe('getUserAvailableProducts', () => {
  const userAvailableProductsMapperMock = partialSpyOn(userAvailableProductsMapperFile, 'userAvailableProductsMapper');
  const getPaymentsClientMock = partialSpyOn(getPaymentsClientFile, 'getPaymentsClient');
  const loggerErrorMock = partialSpyOn(logger, 'error');
  const paymentsClientMock = mockDeep<Payments>();
  const props = mockProps<typeof getUserAvailableProducts>({
    paymentsClientConfig: {},
  });

  beforeEach(() => {
    getPaymentsClientMock.mockReturnValue(paymentsClientMock);
  });

  it('should properly fetch for the user available products and map the result to the object domain', async () => {
    const getUserTierResponseMock = {
      featuresPerService: {
        backups: { enabled: true },
        antivirus: { enabled: true },
        cleaner: { enabled: true },
      },
    } as Tier;

    paymentsClientMock.getUserTier.mockResolvedValue(getUserTierResponseMock);

    const mappedResult = {
      backups: true,
      antivirus: false,
      cleaner: true,
    };

    userAvailableProductsMapperMock.mockReturnValue(mappedResult);

    const result = await getUserAvailableProducts(props);

    expect(getPaymentsClientMock).toHaveBeenCalledWith(props.paymentsClientConfig);
    expect(paymentsClientMock.getUserTier).toHaveBeenCalledTimes(1);
    expect(userAvailableProductsMapperMock).toHaveBeenCalledWith(getUserTierResponseMock.featuresPerService);
    expect(result).toStrictEqual(mappedResult);
  });

  it('should handle errors from paymentsClient.getUserTier and log them', async () => {
    const mockError = new Error('API Error');
    paymentsClientMock.getUserTier.mockRejectedValue(mockError);

    const result = await getUserAvailableProducts(props);

    expect(getPaymentsClientMock).toHaveBeenCalledWith(props.paymentsClientConfig);
    expect(paymentsClientMock.getUserTier).toHaveBeenCalledTimes(1);
    expect(userAvailableProductsMapperMock).not.toHaveBeenCalled();
    expect(loggerErrorMock).toHaveBeenCalledWith({
      tag: 'PRODUCTS',
      msg: 'Failed to get user available products with error:',
      error: mockError,
    });
    expect(result).toBeUndefined();
  });
});
