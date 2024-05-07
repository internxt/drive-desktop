import { RelativePathToAbsoluteConverter } from '../../../../src/context/virtual-drive/shared/application/RelativePathToAbsoluteConverter';

export class RelativePathToAbsoluteConverterTestClass extends RelativePathToAbsoluteConverter {
  private readonly mock = jest.fn();

  constructor() {
    super('');
  }

  run(relativePath: string): string {
    return this.mock(relativePath);
  }

  convertTo(path: string) {
    this.mock.mockReturnValue(path);
  }
}
