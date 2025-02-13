import Logger from 'electron-log';
import path from 'path';
import { isImageThumbnailable } from '../domain/ThumbnableExtension';
import { nativeImage } from 'electron';

export const ThumbnailConfig = {
  MaxWidth: 300,
  MaxHeight: 300,
  Quality: 100,
  Type: 'png',
};

const PAGE_TO_PDF_THUMBNAIL = 1;

// async function generatePDFThumbnail(pdfPath: string): Promise<Buffer> {
//   return new Promise<Buffer>((resolve, reject) => {
//     const pdfThumbnailPath = `${pdfPath}_thumbnail.png`;

//     const pdfThumbnailStream = sharp(pdfPath, {
//       density: 300,
//       page: PAGE_TO_PDF_THUMBNAIL,
//     })
//       .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight, {
//         fit: 'inside',
//       })
//       .toFormat('png');

//     pdfThumbnailStream.toFile(pdfThumbnailPath, (err) => {
//       if (err) {
//         reject(err);
//       }

//       const pdfThumbnail = fs.readFileSync(pdfThumbnailPath);

//       resolve(pdfThumbnail);
//     });
//   });
// }

// async function generateImageThumbnail(filePath: string): Promise<Buffer> {
//   return await sharp(filePath)
//     .resize(ThumbnailConfig.MaxWidth, ThumbnailConfig.MaxHeight, {
//       fit: 'inside',
//     })
//     .toFormat('png')
//     .toBuffer();
// }

async function generateImageThumbnail(filePath: string): Promise<Buffer> {
  const image = nativeImage.createFromPath(filePath);

  if (!image.isEmpty()) {
    // Redimensionar la imagen manteniendo el aspecto
    const resizedImage = image.resize({ width: ThumbnailConfig.MaxHeight });

    // Obtener el buffer como PNG
    const buffer = resizedImage.toPNG();

    return buffer; // Devolver el buffer
  } else {
    throw new Error('No se pudo cargar la imagen.');
  }
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
