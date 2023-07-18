import { WebdavFolder } from '../../folders/domain/WebdavFolder';
import { WebdavFile } from '../../files/domain/WebdavFile';

export type ItemMetadataAtributes = {
  createdAt: number;
  updatedAt: number;
  name: string;
  size: number;
  extension: string;
  type: 'FILE' | 'FOLDER';
  visible: boolean;
  lastPath?: string;
  externalMetadata: Partial<{
    id: number;
    parentId: number | null;
    folderId: number;
    fileId: string;
  }>;
};

export class ItemMetadata {
  private constructor(
    readonly createdAt: number,
    readonly updatedAt: number,
    readonly name: string,
    readonly size: number,
    readonly extension: string,
    readonly type: 'FILE' | 'FOLDER',
    readonly visible: boolean,
    readonly lastPath?: string,
    readonly externalMetadata?: ItemMetadataAtributes['externalMetadata']
  ) {}

  static from(atributes: ItemMetadataAtributes): ItemMetadata {
    return new ItemMetadata(
      atributes.createdAt,
      atributes.updatedAt,
      atributes.name,
      atributes.size,
      atributes.extension,
      atributes.type,
      atributes.visible,
      atributes.lastPath,
      atributes.externalMetadata
    );
  }

  static extractFromFile(file: WebdavFile): ItemMetadata {
    return new ItemMetadata(
      file.createdAt.getTime(),
      file.updatedAt.getTime(),
      file.nameWithExtension,
      file.size,
      file.type,
      'FILE',
      true,
      file.lastPath?.value ?? undefined,
      {
        fileId: file.fileId,
        folderId: file.folderId,
      }
    );
  }

  static extractFromFolder(folder: WebdavFolder): ItemMetadata {
    return new ItemMetadata(
      folder.createdAt.getTime(),
      folder.updatedAt.getTime(),
      folder.name,
      folder.size,
      '',
      'FOLDER',
      true,
      folder.lastPath?.value ?? undefined,
      {
        id: folder.id,
        parentId: folder.parentId,
      }
    );
  }
}
