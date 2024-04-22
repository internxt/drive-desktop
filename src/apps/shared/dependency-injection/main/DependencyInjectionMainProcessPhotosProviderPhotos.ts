import PhotosSubmodule from '@internxt/sdk/dist/photos/photos';
import { obtainToken } from '../../../main/auth/service';

export class DependencyInjectionMainProcessPhotosProviderPhotos {
  private static _photos: PhotosSubmodule;

  static get photos() {
    if (DependencyInjectionMainProcessPhotosProviderPhotos._photos) {
      return DependencyInjectionMainProcessPhotosProviderPhotos._photos;
    }

    const photosUrl = process.env.PHOTOS_URL;

    const newToken = obtainToken('newToken');

    const photosSubmodule = new PhotosSubmodule({
      baseUrl: photosUrl,
      accessToken: newToken,
    });

    DependencyInjectionMainProcessPhotosProviderPhotos._photos =
      photosSubmodule;

    return photosSubmodule;
  }
}
