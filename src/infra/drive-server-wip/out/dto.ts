import { ContentsId, FileUuid, SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid, SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { components } from '@/apps/shared/HttpClient/schema';
import { fileDecryptName } from '@/context/virtual-drive/files/domain/file-decrypt-name';
import { folderDecryptName } from '@/context/virtual-drive/folders/domain/folder-decrypt-name';

export type FileDto = components['schemas']['FileDto'];
export type FolderDto = components['schemas']['FolderDto'];
export type ParsedFileDto = FileDto & {
  uuid: FileUuid;
};
export type ParsedFolderDto = FolderDto & {
  uuid: FolderUuid;
};

export function parseFileDto({ fileDto }: { fileDto: FileDto }): ParsedFileDto {
  return {
    ...fileDto,
    uuid: fileDto.uuid as FileUuid,
  };
}

export function newParseFileDto({ fileDto }: { fileDto: FileDto }): SimpleDriveFile {
  const { name, nameWithExtension } = fileDecryptName({
    encryptedName: fileDto.name,
    parentId: fileDto.folderId,
    extension: fileDto.type,
    plainName: fileDto.plainName,
  });

  return {
    uuid: fileDto.uuid as FileUuid,
    contentsId: fileDto.fileId as ContentsId,
    extension: fileDto.type,
    nameWithExtension,
    name,
    parentId: fileDto.folderId,
    parentUuid: fileDto.folderUuid,
    createdAt: fileDto.createdAt,
    updatedAt: fileDto.updatedAt,
    modificationTime: fileDto.modificationTime,
    status: fileDto.status,
    size: Number(fileDto.size),
  };
}

export function parseFolderDto({ folderDto }: { folderDto: FolderDto }): ParsedFolderDto {
  return {
    ...folderDto,
    uuid: folderDto.uuid as FolderUuid,
  };
}

export function newParseFolderDto({ folderDto }: { folderDto: FolderDto }): SimpleDriveFolder {
  const name = folderDecryptName({
    encryptedName: folderDto.name,
    parentId: folderDto.parentId,
    plainName: folderDto.plainName,
  });

  return {
    uuid: folderDto.uuid as FolderUuid,
    name,
    parentUuid: folderDto.parentUuid,
    createdAt: folderDto.createdAt,
    updatedAt: folderDto.updatedAt,
    status: folderDto.status,
  };
}
