import { LocalFileContentsDirectoryProvider } from '../../../../../src/context/virtual-drive/shared/domain/LocalFileContentsDirectoryProvider';

export class LocalFileContentsDirectoryProviderMock
  implements LocalFileContentsDirectoryProvider
{
  readonly provideMock = jest.fn();

  provide(): Promise<string> {
    return this.provideMock();
  }
}
