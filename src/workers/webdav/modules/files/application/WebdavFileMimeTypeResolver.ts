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

    const resolvedMimeType = MimeTypesMap[`.${filePath.extension()}`];

    if (resolvedMimeType) return resolvedMimeType;

    return WebdavFileMimeTypeResolver.DefaultMimeType;
  }
}
