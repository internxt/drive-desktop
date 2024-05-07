import { SystemThumbnailNameCalculator } from '../../../../../src/context/storage/thumbnails/infrastructrue/local/SystemThumbnailNameCalculator';

export class SystemThumbnailNameCalculatorTestClass extends SystemThumbnailNameCalculator {
  private thumbnailNameMock = jest.fn();

  thumbnailName(original: string): string {
    return this.thumbnailNameMock(original);
  }

  thumbnailNameWillReturn(result: string) {
    this.thumbnailNameMock.mockReturnValue(result);
  }
}
