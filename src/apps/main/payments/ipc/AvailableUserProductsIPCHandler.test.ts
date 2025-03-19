import { AvailableUserProductsIPCMain } from './AvailableUserProductsIPCMain';
import { registerAvailableUserProductsHandlers } from './AvailableUserProductsIPCHandler';
import configStore from '../../config';
import eventBus from '../../event-bus';


jest.mock('electron', () => ({
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    emit: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));


describe('AvailableUserProductsIPCHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get-available-user-products', () => {
    it('should register the handler properly', () => {
      registerAvailableUserProductsHandlers();

      expect(AvailableUserProductsIPCMain.handle).toHaveBeenCalledWith(
        'get-available-user-products',
        expect.any(Function)
      );
    });

    it('should return availableUserProducts properly', async () => {
      const mockProducts = { backups: true };
      jest.spyOn(configStore, 'get').mockReturnValue(mockProducts);

      registerAvailableUserProductsHandlers();
      const handler = (AvailableUserProductsIPCMain.handle as jest.Mock).mock
        .calls[0][1];
      const result = await handler();

      expect(result).toEqual(mockProducts);
      expect(configStore.get).toHaveBeenCalledWith('availableUserProducts');
    });

    it('should throw an error if an uncontrolled error happens', async () => {
      jest.spyOn(configStore, 'get').mockImplementation(() => {
        throw new Error('Unexpected Error');
      });

      registerAvailableUserProductsHandlers();
      const handler = (AvailableUserProductsIPCMain.handle as jest.Mock).mock
        .calls[0][1];

      expect(() => handler()).toThrow('Unexpected Error');
    });
  });

  describe('subscribe-available-user-products', () => {
    it('should register the handler properly', () => {
      registerAvailableUserProductsHandlers();

      expect(AvailableUserProductsIPCMain.on).toHaveBeenCalledWith(
        'subscribe-available-user-products',
        expect.any(Function)
      );
    });

    it('should return availableUserProducts properly', () => {
      const mockEvent = { sender: { send: jest.fn() } };
      const mockProducts = { antivirus: true, backups: true };
      jest.spyOn(configStore, 'get').mockReturnValue(mockProducts);

      registerAvailableUserProductsHandlers();
      const handler = (AvailableUserProductsIPCMain.on as jest.Mock).mock
        .calls[0][1];
      handler(mockEvent);

      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'available-user-products-updated',
        mockProducts
      );
      expect(configStore.get).toHaveBeenCalledWith('availableUserProducts');
    });

    it('should register the handler USER_AVAILABLE_PRODUCTS_UPDATED properly', () => {
      const mockEvent = { sender: { send: jest.fn() } };
      const mockProducts = { antivirus: true, backups: true };
      const eventBusOnSpy = jest.spyOn(eventBus, 'on');
      jest.spyOn(configStore, 'get').mockReturnValue(mockProducts);

      registerAvailableUserProductsHandlers();
      const handler = (AvailableUserProductsIPCMain.on as jest.Mock).mock
        .calls[0][1];
      handler(mockEvent);

      expect(eventBusOnSpy).toHaveBeenCalledWith(
        'USER_AVAILABLE_PRODUCTS_UPDATED',
        expect.any(Function)
      );
    });

    it('should send the updated products on USER_AVAILABLE_PRODUCTS_UPDATED event', () => {
      const mockEvent = { sender: { send: jest.fn() } };
      const mockInitialProducts = { antivirus: true, backups: true };
      const eventBusOnSpy = jest.spyOn(eventBus, 'on');
      jest.spyOn(configStore, 'get').mockReturnValue(mockInitialProducts);

      registerAvailableUserProductsHandlers();

      const subscribeUserProductsHandler = (
        AvailableUserProductsIPCMain.on as jest.Mock
      ).mock.calls[0][1];
      subscribeUserProductsHandler(mockEvent);

      expect(eventBusOnSpy).toHaveBeenCalledWith(
        'USER_AVAILABLE_PRODUCTS_UPDATED',
        expect.any(Function)
      );

      const handlerCall = eventBusOnSpy.mock.calls.find(
        ([event]) => event === 'USER_AVAILABLE_PRODUCTS_UPDATED'
      );
      expect(handlerCall).toBeDefined();

      const userAvailableProductsUpdatedHandler = handlerCall?.[1];
      expect(userAvailableProductsUpdatedHandler).toBeInstanceOf(Function);

      const mockUpdatedProducts = { backups: false, antivirus: true };
      userAvailableProductsUpdatedHandler?.(mockUpdatedProducts as any);

      expect(mockEvent.sender.send).toHaveBeenCalledWith(
        'available-user-products-updated',
        mockUpdatedProducts
      );
    });

    it('should throw an error if an uncontrolled error happens', () => {
      jest.spyOn(configStore, 'get').mockImplementation(() => {
        throw new Error('Unexpected Error');
      });
      jest.spyOn(configStore, 'get').mockImplementation(() => {
        throw new Error('Unexpected Error');
      });

      registerAvailableUserProductsHandlers();
      const handler = (AvailableUserProductsIPCMain.handle as jest.Mock).mock
        .calls[0][1];

      expect(() => handler()).toThrow('Unexpected Error');
    });
  });
});
