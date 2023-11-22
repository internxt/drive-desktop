import { LocationProvider } from '../../../../../src/context/virtual-drive/contents/infrastructure/FSLocalFileSystem';

export class LocationProviderMock {
  public mock = jest.fn();

  provider: LocationProvider = this.mock;
}
