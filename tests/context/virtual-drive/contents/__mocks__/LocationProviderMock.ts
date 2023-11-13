import { LocationProvider } from '../../../../../src/context/virtual-drive/contents/infrastructure/FSLocalFileWriter';

export class LocationProviderMock {
  public mock = jest.fn();

  provider: LocationProvider = this.mock;
}
