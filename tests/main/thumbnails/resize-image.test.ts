import { execSync } from 'child_process';
import { createReadStream } from 'fs';
import path from 'path';
import { resizeImage } from '../../../src/apps/main/thumbnails/application/resize-image';
import { ThumbnailConfig } from '../../../src/apps/main/thumbnails/domain/ThumbnailProperties';
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

    const buffer = await resizeImage({ file: image });

    expect(buffer).not.toBeNull();
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('After the resize the file has the thumbnails dimensions', async () => {
    const image = createReadStream(
      path.join(__dirname, 'fixtures', '1000x1000.jpg')
    );
    const buffer = await resizeImage({ file: image });

    const { width, height } = await getFileSize(buffer);

    expect(width).toBe(ThumbnailConfig.MaxHeight);
    expect(height).toBe(ThumbnailConfig.MaxWidth);
  });
});
