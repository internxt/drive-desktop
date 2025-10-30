import path from 'path';

import configStore from '../../config';
import { isImageThumbnailable, isPdfThumbnailable } from '../domain/ThumbnableExtension';
import { generateImageThumbnail } from './generate-image-thumbnail';
import { generatePDFThumbnail } from './generate-pdf-thumbnail';

function getExtension(pathLike: string) {
  const { ext } = path.parse(pathLike);

  return ext.replace('.', '');
}

type Props = {
  absolutePath: string;
};

export async function obtainImageToThumbnailIt({ absolutePath }: Props) {
  const ext = getExtension(absolutePath);

  const root = configStore.get('syncRoot');
  const filePath = path.join(root, absolutePath);

  if (isPdfThumbnailable(ext)) {
    return generatePDFThumbnail({ absolutePath: filePath });
  }

  if (isImageThumbnailable(ext)) {
    return generateImageThumbnail({ absolutePath: filePath });
  }

  return undefined;
}
