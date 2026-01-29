import { getUserAvailableProducts } from './services/get-user-available-products';

export type { UserAvailableProducts } from './payments.types';
export const PaymentsModule = {
  getUserAvailableProducts,
};
