import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { useEffect, useState } from 'react';

export function useUserAvailableProducts() {
  const [products, setProducts] = useState<UserAvailableProducts | undefined>(undefined);

  const handleSetProducts = (products: UserAvailableProducts | undefined) => {
    setProducts(products);
  };

  useEffect(() => {
    const { userAvailableProducts } = window.electron;
    userAvailableProducts.get().then(handleSetProducts).catch((error) => {
      console.error('Failed to fetch user available products:', error);
    });

    userAvailableProducts.subscribe();

    const listener = userAvailableProducts.onUpdate(handleSetProducts);

    return listener;
  }, []);

  return {
    products,
  };
}
