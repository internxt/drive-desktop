import eventBus from '../event-bus';
import { buildPaymentsService } from './builder';
import Logger from 'electron-log';
import { jest } from '@jest/globals';
import { getUserAvailableProductsAndStore } from './handler';

jest.mock('../event-bus', () => ({
  on: jest.fn(),
  emit: jest.fn(),
}));

jest.mock('electron-log', () => ({
  error: jest.fn(),
}));

jest.mock('./builder', () => ({
  buildPaymentsService: jest.fn(),
}));

describe('paymentServiceHandlers', () => {
  let mockPaymentsService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaymentsService = {
      getAvailableProducts: jest.fn(),
      storeUserProducts: jest.fn(),
      getStoredUserProducts: jest.fn(),
    };

    (buildPaymentsService as jest.Mock).mockReturnValue(mockPaymentsService);

    // Important: Re-import the handler module before each test
    // This ensures the event handlers are registered fresh for each test
    jest.isolateModules(() => {
      require('./handler');
    });
  });

  describe('getUserAvailableProductsAndStore', () => {
    it('should emit the eventBus USER_AVAILABLE_PRODUCTS_UPDATED event when products are different', async () => {
      const mockFetchedProducts = { backups: true, antivirus: true };
      const mockStoredProducts = { backups: false, antivirus: true };
      mockPaymentsService.getAvailableProducts.mockResolvedValue(mockFetchedProducts);
      mockPaymentsService.getStoredUserProducts.mockReturnValue(mockStoredProducts);

      await getUserAvailableProductsAndStore();

      expect(mockPaymentsService.getAvailableProducts).toHaveBeenCalled();
      expect(mockPaymentsService.getStoredUserProducts).toHaveBeenCalled();
      expect(mockPaymentsService.storeUserProducts).toHaveBeenCalledWith(mockFetchedProducts);
      expect(eventBus.emit).toHaveBeenCalledWith('USER_AVAILABLE_PRODUCTS_UPDATED', mockFetchedProducts);
    });

    it('should emit the eventBus USER_AVAILABLE_PRODUCTS_UPDATED event when no stored products exist', async () => {
      const mockFetchedProducts = { backups: true, antivirus: true };
      mockPaymentsService.getAvailableProducts.mockResolvedValue(mockFetchedProducts);
      mockPaymentsService.getStoredUserProducts.mockReturnValue(undefined);

      await getUserAvailableProductsAndStore();

      expect(mockPaymentsService.getAvailableProducts).toHaveBeenCalled();
      expect(mockPaymentsService.getStoredUserProducts).toHaveBeenCalled();
      expect(mockPaymentsService.storeUserProducts).toHaveBeenCalledWith(mockFetchedProducts);
      expect(eventBus.emit).toHaveBeenCalledWith('USER_AVAILABLE_PRODUCTS_UPDATED', mockFetchedProducts);
    });

    it('should NOT emit the eventBus USER_AVAILABLE_PRODUCTS_UPDATED event when products are the same', async () => {
      const mockProducts = { backups: true, antivirus: true };
      mockPaymentsService.getAvailableProducts.mockResolvedValue(mockProducts);
      mockPaymentsService.getStoredUserProducts.mockReturnValue(mockProducts);

      await getUserAvailableProductsAndStore();

      expect(mockPaymentsService.getAvailableProducts).toHaveBeenCalled();
      expect(mockPaymentsService.getStoredUserProducts).toHaveBeenCalled();
      expect(mockPaymentsService.storeUserProducts).not.toHaveBeenCalled();
      expect(eventBus.emit).not.toHaveBeenCalledWith('USER_AVAILABLE_PRODUCTS_UPDATED', mockProducts);
    });

    it('should log an error if paymentsService.getAvailableProducts throws an error', async () => {
      const error = new Error('API failure');
      mockPaymentsService.getAvailableProducts.mockRejectedValue(error);


      await getUserAvailableProductsAndStore();

      expect(Logger.error).toHaveBeenCalledWith(
        `[PRODUCTS] Failed to get user available products with error: ${error}`
      );
    });
  });

  describe('on eventBus USER_LOGGED_IN event', () => {
    it('should register event handler and call getUserAvailableProductsAndStore', () => {
      expect(eventBus.on).toHaveBeenCalledWith('USER_LOGGED_IN', expect.any(Function));

      const userLoggedInCalls = (eventBus.on as jest.Mock).mock.calls.filter(
        ([event]) => event === 'USER_LOGGED_IN'
      );
      expect(userLoggedInCalls.length).toBe(1);

      const handler = userLoggedInCalls[0][1];

      // Simulate the event being triggered
      handler();

      expect(mockPaymentsService.getAvailableProducts).toHaveBeenCalled();
    });
  });

  describe('on eventBus GET_USER_AVAILABLE_PRODUCTS event', () => {
    it('should register event handler and call getUserAvailableProductsAndStore', () => {
      expect(eventBus.on).toHaveBeenCalledWith('GET_USER_AVAILABLE_PRODUCTS', expect.any(Function));

      const getProductsCalls = (eventBus.on as jest.Mock).mock.calls.filter(
        ([event]) => event === 'GET_USER_AVAILABLE_PRODUCTS'
      );
      expect(getProductsCalls.length).toBe(1);

      const handler = getProductsCalls[0][1];

      // Simulate the event being triggered
      handler();

      expect(mockPaymentsService.getAvailableProducts).toHaveBeenCalled();
    });
  });
});
