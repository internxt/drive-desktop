import { LocalItemMetaData } from "../../../Listings/domain/LocalItemMetaData";

export class LocalItemMetaDataMother {
  static file({
    name,
    ino,
    dev,
  }: {
    name: string;
    ino: number;
    dev: number;
  }): LocalItemMetaData {
    return LocalItemMetaData.from({
      modtime: 90,
      size: 100,
      isFolder: false,
      name,
      ino,
      dev,
    });
  }

  static folder({
    name,
    ino,
    dev,
  }: {
    name: string;
    ino: number;
    dev: number;
  }): LocalItemMetaData {
    return LocalItemMetaData.from({
      modtime: 90,
      size: 100,
      isFolder: true,
      name,
      ino,
      dev,
    });
  }
}
