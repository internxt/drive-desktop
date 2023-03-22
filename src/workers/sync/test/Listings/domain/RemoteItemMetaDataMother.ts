import { RemoteItemMetaData } from '../../../Listings/domain/RemoteItemMetaData';

export class RemoteItemMetaDataMother {
  static file({ name, id }: { name: string; id: number }): RemoteItemMetaData {
    return RemoteItemMetaData.from({
      modtime: 90,
      size: 100,
      isFolder: false,
      name,
      id,
    });
  }

  static folder({
    name,
    id,
  }: {
    name: string;
    id: number;
  }): RemoteItemMetaData {
    return RemoteItemMetaData.from({
      modtime: 90,
      size: 100,
      isFolder: true,
      name,
      id,
    });
  }
}
