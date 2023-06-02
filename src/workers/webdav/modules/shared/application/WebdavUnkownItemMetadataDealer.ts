import { FileMetadataCollection } from '../../files/domain/FileMetadataCollection';
import {
  ItemMetadata,
  ItemMetadataAtributes,
} from '../../shared/domain/ItemMetadata';
import { WebdavUnknownItemTypeSearcher } from './WebdavUnknownItemTypeSearcher';

export class WebdavUnkownItemMetadataDealer {
  constructor(
    private readonly unknownItemSearcher: WebdavUnknownItemTypeSearcher,
    private readonly temporalFileMeatadaCollection: FileMetadataCollection
  ) {}

  run<T extends keyof ItemMetadataAtributes>(
    path: string,
    attribute: T
  ): ItemMetadataAtributes[T] | undefined {
    const item = this.unknownItemSearcher.run(path);

    if (!item) {
      const metadata = this.temporalFileMeatadaCollection.get(path);

      if (!metadata) return;

      return metadata[attribute];
    }

    if (item.isFile()) {
      return ItemMetadata.extractFromFile(item)[attribute];
    }

    if (item.isFolder()) {
      return ItemMetadata.extractFromFolder(item)[attribute];
    }

    return undefined;
  }
}
