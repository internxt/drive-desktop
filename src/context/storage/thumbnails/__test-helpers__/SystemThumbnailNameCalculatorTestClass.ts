import { SystemThumbnailNameCalculator } from '../infrastructrue/local/SystemThumbnailNameCalculator';

export class SystemThumbnailNameCalculatorTestClass extends SystemThumbnailNameCalculator {
  private thumbnailNameMock = vi.fn();

  thumbnailName(original: string): string {
    return this.thumbnailNameMock(original);
  }

  thumbnailNameWillReturn(result: string) {
    this.thumbnailNameMock.mockReturnValue(result);
  }
}
