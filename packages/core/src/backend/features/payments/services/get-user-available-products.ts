import { logger } from '@/backend/core/logger/logger';

import { userAvailableProductsMapper } from '../user-available-products.mapper';
import { getPaymentsClient, PaymentsClientConfig } from './get-payments-client';

export async function getUserAvailableProducts({ paymentsClientConfig }: { paymentsClientConfig: PaymentsClientConfig }) {
  try {
    const paymentsClient = getPaymentsClient(paymentsClientConfig);
    const userProductsInfo = await paymentsClient.getUserTier();
    return userAvailableProductsMapper(userProductsInfo.featuresPerService);
  } catch (error) {
    logger.sentryError({ tag: 'PRODUCTS', msg: 'Get user products error', error });
    return undefined;
  }
}
