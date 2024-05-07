import crypto from 'crypto';
import { Service } from 'diod';

export type ThumbnailSize = 'normal' | 'large' | 'x-large' | 'xx-large';

@Service()
export class SystemThumbnailNameCalculator {
  thumbnailName(original: string) {
    const md5Hash = crypto.createHash('md5').update(original).digest('hex');

    return md5Hash + '.png';
  }
}
