import { AvailableProducts } from '@internxt/sdk/dist/drive/payments/types';
import { useEffect, useState } from 'react';

export function useUserAvailableProducts() {
  const [products, setProducts] = useState<AvailableProducts['featuresPerService'] | undefined>(undefined);

  const handleSetProducts = (products: AvailableProducts['featuresPerService'] | undefined) => {
    setProducts(products);
  };

  useEffect(() => {
    const { userAvailableProducts } = window.electron;
    userAvailableProducts.get().then(handleSetProducts);

    userAvailableProducts.subscribe();

    const listener = userAvailableProducts.onUpdate(handleSetProducts);

    return listener;
  }, []);

  return {
    products,
  };
}
