import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { obtainToken } from '../../../main/auth/service';

export class Photos {
  private static _photos: PhotosSubmodule;

  static get photos() {
    if (Photos._photos) {
      return Photos._photos;
    }

    const photosUrl = process.env.PHOTOS_URL;

    const newToken = obtainToken('newToken');

    const photosSubmodule = new PhotosSubmodule({
      baseUrl: photosUrl,
      accessToken: newToken,
    });

    Photos._photos = photosSubmodule;

    return photosSubmodule;
  }
}
