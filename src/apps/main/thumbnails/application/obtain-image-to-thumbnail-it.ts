import Logger from 'electron-log';
import path from 'path';
import {
  isImageThumbnailable,
  isPdfThumbnailable,
} from '../domain/ThumbnableExtension';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';

export const ThumbnailConfig = {
  MaxWidth: 300,
  MaxHeight: 300,
  Quality: 100,
  Type: 'png',
};

async function generatePDFThumbnail(filePath: string): Promise<Buffer> {
  const fileBuffer = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });

  const [page] = pdfDoc.getPages();
  const { width, height } = page.getSize();

  const scale = Math.min(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight);
  const thumbnailWidth = width * scale;
  const thumbnailHeight = height * scale;

  const thumbnailDoc = await PDFDocument.create();
  const copiedPage = await thumbnailDoc.copyPages(pdfDoc, [0]);
  const thumbnailPage = copiedPage[0];

  thumbnailPage.setSize(thumbnailWidth, thumbnailHeight);
  thumbnailDoc.addPage(thumbnailPage);

  const thumbnailUint8Array = await thumbnailDoc.save();

  // Usar sharp para convertir la página a PNG
  const pngBuffer = await sharp(thumbnailUint8Array)
    .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight, {
      fit: 'inside', // Ajustar dentro de las dimensiones
    })
    .toFormat('png')
    .toBuffer();

  return pngBuffer;
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

  if (isPdfThumbnailable(ext)) {
    return await generatePDFThumbnail(filePath);
  }

  return undefined;
}
