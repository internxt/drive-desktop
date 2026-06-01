import { UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { useEffect, useState } from 'react';

export function useUserAvailableProducts() {
  const [products, setProducts] = useState<UserAvailableProducts | undefined>(undefined);

  useEffect(() => {
    const { userAvailableProducts } = window.electron;
    userAvailableProducts
      .get()
      .then(setProducts)
      .catch((error) => {
        window.electron.logger.error({
          msg: '[RENDERER] Failed to fetch user available products',
          error,
        });
      });

    userAvailableProducts.subscribe();

    const listener = userAvailableProducts.onUpdate(setProducts);

    return listener;
  }, []);

  return {
    products,
  };
}
