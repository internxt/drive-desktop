import Logger from 'electron-log';
import { createReadStream } from 'fs';
import path from 'path';
import { Readable } from 'stream';

import configStore from '../../config';
import {
  isImageThumbnailable,
  isPdfThumbnailable,
} from '../domain/ThumbnableExtension';
import { extractFirstPageAsReadablePNG } from './extract-pdf-page';

interface ThumbnailGenerated {
  file: File | null;
  max_width: number;
  max_height: number;
  type: string;
}

function getExtension(pathLike: string) {
  const { ext } = path.parse(pathLike);

  return ext.replace('.', '');
}

export async function obtainImageToThumbnailIt(
  name: string
): Promise<Readable | undefined> {
  const ext = getExtension(name);

  const root = configStore.get('syncRoot');
  const filePath = path.join(root, name);

  Logger.info(`[THUMBNAIL] Obtaining image to thumbnail: ${filePath}`);

  Logger.info(`[THUMBNAIL] Extension: ${ext}`);

  if (isPdfThumbnailable(ext)) {
    return extractFirstPageAsReadablePNG(filePath);
  }

  if (isImageThumbnailable(ext)) {
    return createReadStream(filePath);
  }

  return undefined;
}

// const getImageThumbnail = (file: File): Promise<ThumbnailGenerated['file']> => {
//   return new Promise((resolve) => {
//     Resizer.imageFileResizer(
//       file,
//       ThumbnailConfig.MaxWidth,
//       ThumbnailConfig.MaxHeight,
//       ThumbnailConfig.Type,
//       ThumbnailConfig.Quality,
//       0,
//       (uri) => {
//         if (uri && uri instanceof File) resolve(uri);
//         else resolve(null);
//       },
//       'file'
//     );
//   });
// };

// const getPDFThumbnail = async (
//   file: File
// ): Promise<ThumbnailGenerated['file']> => {
//   const loadingTask = pdfjs.getDocument(await file.arrayBuffer());
//   const pdfDocument = await loadingTask.promise;
//   const page = await pdfDocument.getPage(1);
//   const viewport = page.getViewport({ scale: 1.0 });

//   const canvas = document.createElement('canvas');
//   canvas.width = viewport.width;
//   canvas.height = viewport.height;
//   const canvasContext = canvas.getContext('2d', { alpha: false });

//   if (canvasContext) {
//     const renderTask = page.render({ canvasContext, viewport });
//     await renderTask.promise;
//     await loadingTask.destroy();
//     return new Promise((resolve) => {
//       // Convert the canvas to an image buffer.
//       canvas.toBlob((blob: Blob | null) => {
//         if (blob) {
//           resolve(new File([blob], ''));
//         } else {
//           resolve(null);
//         }
//       });
//     });
//   }
//   return null;
// };
