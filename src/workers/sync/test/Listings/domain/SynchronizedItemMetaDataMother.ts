import { SynchronizedItemMetaData } from '../../../Listings/domain/SynchronizedItemMetaData';

export class SynchronizedItemMetaDataMother {
  static folder({
    name,
    id,
    ino,
    dev,
  }: {
    name: string;
    id: number;
    ino: number;
    dev: number;
  }): SynchronizedItemMetaData {
    return SynchronizedItemMetaData.from({
      modtime: 2,
      size: 100,
      isFolder: true,
      name,
      id,
      ino,
      dev,
    });
  }

  static file({
    name,
    id,
    ino,
    dev,
  }: {
    name: string;
    id: number;
    ino: number;
    dev: number;
  }): SynchronizedItemMetaData {
    return SynchronizedItemMetaData.from({
      modtime: 2,
      size: 100,
      isFolder: false,
      name,
      id,
      ino,
      dev,
    });
  }
}
