/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable sonarjs/no-unused-vars */
import { components } from '@internxt/drive-desktop-core/build/backend';
import { FileUuid } from '@/apps/main/database/entities/DriveFile';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

export type FileDto = components['schemas']['FileDto'];
export type FolderDto = components['schemas']['FolderDto'];
/**
 * v2.7.3 Alexis Mora
 * The backend is dropping the numeric `id` of files in favour of `uuid` and may return a dummy value
 * until then (PB-6987), so we strip it here to make sure nothing relies on it.
 */
export type ParsedFileDto = Omit<FileDto, 'id' | 'fileId' | 'thumbnails' | 'isFavorite'> & {
  uuid: FileUuid;
  fileId: string;
};
export type ParsedFolderDto = Omit<FolderDto, 'isFavorite'> & {
  uuid: FolderUuid;
};

export function parseFileDto({ fileDto }: { fileDto: FileDto }): ParsedFileDto {
  const { id: _id, isFavorite: _isFavorite, thumbnails: _thumbnails, ...parsedFileDto } = fileDto;

  return {
    ...parsedFileDto,
    uuid: fileDto.uuid as FileUuid,
    fileId: fileDto.fileId ?? '',
  };
}

export function parseFolderDto({ folderDto }: { folderDto: FolderDto }): ParsedFolderDto {
  const { isFavorite: _isFavorite, ...parsedFolderDto } = folderDto;

  return {
    ...parsedFolderDto,
    uuid: folderDto.uuid as FolderUuid,
  };
}
