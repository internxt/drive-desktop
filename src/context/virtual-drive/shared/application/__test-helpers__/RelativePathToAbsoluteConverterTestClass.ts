import { RelativePathToAbsoluteConverter } from '../RelativePathToAbsoluteConverter';

export class RelativePathToAbsoluteConverterTestClass extends RelativePathToAbsoluteConverter {
  private readonly mock = vi.fn();

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
