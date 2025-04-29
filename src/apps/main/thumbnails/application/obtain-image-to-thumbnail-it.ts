import path from 'path';
import { isImageThumbnailable } from '../domain/ThumbnableExtension';
import { nativeImage } from 'electron';

const ThumbnailConfig = {
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
    const resizedImage = image.resize({ width: ThumbnailConfig.MaxHeight });

    const buffer = resizedImage.toPNG();

    return buffer;
  } else {
    throw new Error('cant create image from path');
  }
}

function getExtension(pathLike: string) {
  const { ext } = path.parse(pathLike);

  return ext.replace('.', '');
}

export async function obtainImageToThumbnailIt(filePath: string): Promise<Buffer | undefined> {
  const ext = getExtension(filePath);

  if (isImageThumbnailable(ext)) {
    return await generateImageThumbnail(filePath);
  }

  // if (isPdfThumbnailable(ext)) {
  //   return await generatePDFThumbnail(filePath);
  // }

  return undefined;
}
