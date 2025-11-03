import { nativeImage } from 'electron';
import { ThumbnailConfig } from '../domain/ThumbnailProperties';

type Props = {
  absolutePath: string;
};

export function generateImageThumbnail({ absolutePath }: Props) {
  const image = nativeImage.createFromPath(absolutePath);

  if (!image.isEmpty()) {
    const resizedImage = image.resize({
      width: ThumbnailConfig.MaxWidth,
      height: ThumbnailConfig.MaxHeight,
    });

    const buffer = resizedImage.toPNG();

    return buffer;
  } else {
    throw new Error('cant create image from path');
  }
}
