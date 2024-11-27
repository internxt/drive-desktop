import Logger from 'electron-log';
import path from 'path';
import {
  isImageThumbnailable,
  isPdfThumbnailable,
} from '../domain/ThumbnableExtension';
import sharp from 'sharp';
import fs from 'fs';

export const ThumbnailConfig = {
  MaxWidth: 300,
  MaxHeight: 300,
  Quality: 100,
  Type: 'png',
};

const PAGE_TO_PDF_THUMBNAIL = 1;

async function generatePDFThumbnail(pdfPath: string): Promise<Buffer> {
  return new Promise<Buffer>((resolve, reject) => {
    const pdfThumbnailPath = `${pdfPath}_thumbnail.png`;

    const pdfThumbnailStream = sharp(pdfPath, {
      density: 300,
      page: PAGE_TO_PDF_THUMBNAIL,
    })
      .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight, {
        fit: 'inside',
      })
      .toFormat('png');

    pdfThumbnailStream.toFile(pdfThumbnailPath, (err) => {
      if (err) {
        reject(err);
      }

      const pdfThumbnail = fs.readFileSync(pdfThumbnailPath);

      resolve(pdfThumbnail);
    });
  });
}

async function generateImageThumbnail(filePath: string): Promise<Buffer> {
  return await sharp(filePath)
    .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight, {
      fit: 'inside',
    })
    .toFormat('png')
    .toBuffer();
}

function getExtension(pathLike: string) {
  const { ext } = path.parse(pathLike);

  return ext.replace('.', '');
}

export async function obtainImageToThumbnailIt(
  filePath: string
): Promise<Buffer | undefined> {
  const ext = getExtension(filePath);

  Logger.info(`[THUMBNAIL] Extension: ${ext}`);

  if (isImageThumbnailable(ext)) {
    return await generateImageThumbnail(filePath);
  }

  // if (isPdfThumbnailable(ext)) {
  //   return await generatePDFThumbnail(filePath);
  // }

  return undefined;
}
