import { PaymentsModule, UserAvailableProducts } from '@internxt/drive-desktop-core/build/backend';
import { partialSpyOn, call, deepMocked } from '../../../../../tests/vitest/utils.helper';
import * as areProductsEqualModule from './are-products-equal';
import configStore from '../../../../apps/main/config';
import eventBus from '../../../../apps/main/event-bus';
import { getUserAvailableProductsAndStore } from './get-user-available-products-and-store';

vi.mock(import('../../../../apps/shared/HttpClient/background-process-clients'));
vi.mock(import('../../../../apps/main/auth/service'));
vi.mock(import('../../../../apps/main/app-info/app-info'));

const fetchedProducts: UserAvailableProducts = {
  antivirus: true,
  backups: true,
  cleaner: false,
};

describe('getUserAvailableProductsAndStore', () => {
  const getUserAvailableProductsMock = deepMocked(PaymentsModule.getUserAvailableProducts);
  const configGetMock = partialSpyOn(configStore, 'get');
  const configSetMock = partialSpyOn(configStore, 'set');
  const areProductsEqualMock = partialSpyOn(areProductsEqualModule, 'areProductsEqual');
  const eventBusEmitMock = partialSpyOn(eventBus, 'emit');

  it('should not store or emit when API returns undefined', async () => {
    getUserAvailableProductsMock.mockResolvedValue(undefined);

    await getUserAvailableProductsAndStore();

    expect(configSetMock).not.toBeCalled();
    expect(eventBusEmitMock).not.toBeCalled();
  });

  it('should not store or emit when products are equal', async () => {
    getUserAvailableProductsMock.mockResolvedValue(fetchedProducts);
    areProductsEqualMock.mockReturnValue(true);

    await getUserAvailableProductsAndStore();

    expect(configSetMock).not.toBeCalled();
    expect(eventBusEmitMock).not.toBeCalled();
  });

  it('should store and emit when products differ', async () => {
    getUserAvailableProductsMock.mockResolvedValue(fetchedProducts);
    areProductsEqualMock.mockReturnValue(false);

    await getUserAvailableProductsAndStore();

    call(configSetMock).toStrictEqual(['availableUserProducts', fetchedProducts]);
    call(eventBusEmitMock).toStrictEqual(['USER_AVAILABLE_PRODUCTS_UPDATED', fetchedProducts]);
  });

  it('should compare fetched products against stored products', async () => {
    const storedProducts: UserAvailableProducts = {
      antivirus: false,
      backups: false,
      cleaner: false,
    };
    configGetMock.mockReturnValue(storedProducts);
    getUserAvailableProductsMock.mockResolvedValue(fetchedProducts);
    areProductsEqualMock.mockReturnValue(false);

    await getUserAvailableProductsAndStore();

    call(areProductsEqualMock).toStrictEqual({
      stored: storedProducts,
      fetched: fetchedProducts,
    });
  });
});
