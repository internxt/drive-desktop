import { Folder } from '../../folders/domain/Folder';
import { File } from '../../files/domain/File';

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

  static extractFromFile(file: File): ItemMetadata {
    return new ItemMetadata(
      file.createdAt.getTime(),
      file.updatedAt.getTime(),
      file.nameWithExtension,
      file.size,
      file.type,
      'FILE'
    );
  }

  static extractFromFolder(folder: Folder): ItemMetadata {
    return new ItemMetadata(
      folder.createdAt.getTime(),
      folder.updatedAt.getTime(),
      folder.name,
      folder.size,
      '',
      'FOLDER'
    );
  }
}
