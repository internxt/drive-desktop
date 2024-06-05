import { Path } from '../../../../src/context/shared/domain/value-objects/Path';

class PathTest extends Path {}

describe('Path', () => {
  it('does not mark a path with ":" in the middle as malicious', () => {
    const path = '/My Folder:/file.txt';

    try {
      new PathTest(path);
    } catch (err) {
      expect(err).not.toBeDefined();
    }
  });
});
