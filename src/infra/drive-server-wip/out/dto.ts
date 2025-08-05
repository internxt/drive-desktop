import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { components } from '@/apps/shared/HttpClient/schema';

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

export function parseFolderDto({ folderDto }: { folderDto: FolderDto }): ParsedFolderDto {
  return {
    ...folderDto,
    uuid: folderDto.uuid as FolderUuid,
  };
}
