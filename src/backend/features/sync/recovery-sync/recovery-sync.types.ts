import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

export type FileProps = { remotes: ParsedFileDto[]; locals: SimpleDriveFile[] };
export type FolderProps = { remotes: ParsedFolderDto[]; locals: SimpleDriveFolder[] };
