import { FilePath } from '../domain/FilePath';

import MimeTypesMap, {
  MimeTypes,
  UnknownMimeType,
} from '../domain/MimeTypesMap';

export class WebdavFileMimeTypeResolver {
  private static DefaultMimeType: UnknownMimeType = 'application/octet-stream';

  run(path: string): MimeTypes | UnknownMimeType | undefined {
    const filePath = new FilePath(path);

    if (!filePath.hasExtension()) {
      return WebdavFileMimeTypeResolver.DefaultMimeType;
    }

    return MimeTypesMap[`.${filePath.extension()}`];
  }
}
