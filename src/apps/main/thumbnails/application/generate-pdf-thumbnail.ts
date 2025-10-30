import { resizeImage } from './resize-image';

type Props = {
  absolutePath: string;
};

export function generatePDFThumbnail({ absolutePath }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gm = require('gm').subClass({ imageMagick: true });

  const pdfFirstPage = gm(absolutePath + '[0]')
    .density(300, 300)
    .quality(100)
    .stream('png');

  return resizeImage(pdfFirstPage);
}
