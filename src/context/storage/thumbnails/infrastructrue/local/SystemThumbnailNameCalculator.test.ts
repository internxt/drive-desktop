import { SystemThumbnailNameCalculator } from './SystemThumbnailNameCalculator';

describe('System Thumbnail Name Calculator', () => {
  const SUT = new SystemThumbnailNameCalculator();

  it('creates the correct has for a given uri', () => {
    const uri = 'file:///home/jens/photos/me.png';

    const md5Hash = SUT.thumbnailName(uri);

    expect(md5Hash).toBe('c6ee772d9e49320e97ec29a7eb5b1697.png');
  });
});
