import { Payments } from '@internxt/sdk/dist/drive';
import configStore from '../config';
import { jest } from '@jest/globals';
import { PaymentsService } from './service';

jest.mock('../config', () => ({
  set: jest.fn(),
  get: jest.fn(),
}));

describe('PaymentsService', () => {
  let sut: PaymentsService;
  let mockPaymentsSDK: jest.Mocked<Payments>;;

  beforeEach(() => {
    jest.clearAllMocks();

    mockPaymentsSDK = {
      checkUserAvailableProducts: jest.fn(),
    } as unknown as jest.Mocked<Payments>;

    sut = new PaymentsService(mockPaymentsSDK);
  });
  describe('getAvailableProducts', () => {
    it('should retrieve the products from the Payments SDK and return them', async () => {
      const mockResult = {
        featuresPerService: {
          backups: true,
          antivirus: false
        },
      };

      mockPaymentsSDK.checkUserAvailableProducts.mockResolvedValue(mockResult);

      const result = await sut.getAvailableProducts();

      expect(mockPaymentsSDK.checkUserAvailableProducts).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult.featuresPerService);
    });

    it('should propagate errors from the SDK', async () => {
      const mockError = new Error('Network error');
      mockPaymentsSDK.checkUserAvailableProducts.mockRejectedValue(mockError);


      await expect(sut.getAvailableProducts()).rejects.toThrow(mockError);

      expect(mockPaymentsSDK.checkUserAvailableProducts).toHaveBeenCalledTimes(1);
    });
  });

  describe('storeUserProducts', () => {
    it('should store the products in the config store', async () => {
      const mockProducts = {
        backups: true,
        antivirus: false
      };

      await sut.storeUserProducts(mockProducts);

      expect(configStore.set).toHaveBeenCalledTimes(1);
      expect(configStore.set).toHaveBeenCalledWith('availableUserProducts', mockProducts);
    });
  });
});
