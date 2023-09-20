import { LocationProvider } from '../../infrastructure/FSLocalFileWriter';

export class LocationProviderMock {
  public mock = jest.fn();

  provider: LocationProvider = this.mock;
}
