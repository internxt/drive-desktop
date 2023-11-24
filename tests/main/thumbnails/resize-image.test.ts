import { execSync } from 'child_process';
import { createReadStream } from 'fs';
import path from 'path';
import { reziseImage } from '../../../src/apps/main/thumbnails/application/resize-image';
import { ThumbnailProperties } from '../../../src/apps/main/thumbnails/domain/ThumbnailProperties';
import { getFileSize } from './helpers';

describe.skip('GM Resize Image', () => {
  it('gm is installed', () => {
    expect(() => {
      execSync('gm version', { stdio: 'ignore' });
    }).not.toThrow();
  });

  it('The reszise of  an image returns a buffer with contents', async () => {
    const image = createReadStream(
      path.join(__dirname, 'fixtures', '1000x1000.jpg')
    );

    const buffer = await reziseImage(image);

    expect(buffer).not.toBeNull();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('After the resize the file has the thumbnails dimensions', async () => {
    const image = createReadStream(
      path.join(__dirname, 'fixtures', '1000x1000.jpg')
    );
    const buffer = await reziseImage(image);

    const { width, height } = await getFileSize(buffer);

    expect(width).toBe(ThumbnailProperties.dimensions);
    expect(height).toBe(ThumbnailProperties.dimensions);
  });
});
