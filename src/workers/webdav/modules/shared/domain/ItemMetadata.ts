import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFile } from '../../files/domain/WebdavFile';

export type ItemMetadataAtributes = {
  createdAt: number;
  updatedAt: number;
  name: string;
  size: number;
  extension: string;
  type: 'FILE' | 'FOLDER';
};

export class ItemMetadata {
  private constructor(
    readonly createdAt: number,
    readonly updatedAt: number,
    readonly name: string,
    readonly size: number,
    readonly extension: string,
    readonly type: 'FILE' | 'FOLDER'
  ) {}

  static from(atributes: ItemMetadataAtributes): ItemMetadata {
    return new ItemMetadata(
      atributes.createdAt,
      atributes.updatedAt,
      atributes.name,
      atributes.size,
      atributes.extension,
      atributes.type
    );
  }

  static extractFromFile(file: WebdavFile): ItemMetadata {
    return new ItemMetadata(
      file.createdAt.getTime(),
      file.updatedAt.getTime(),
      file.nameWithExtension,
      file.size.value,
      file.type,
      'FILE'
    );
  }

  static extractFromFolder(folder: WebdavFolder): ItemMetadata {
    return new ItemMetadata(
      Math.abs(folder.createdAt.getTime() | Date.now()),
      Math.abs(folder.updatedAt.getTime() | Date.now()),
      folder.name,
      folder.size,
      '',
      'FOLDER'
    );
  }
}
