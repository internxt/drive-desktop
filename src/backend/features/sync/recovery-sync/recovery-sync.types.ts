import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

export type FileProps = { ctx: SyncContext; remotes: ParsedFileDto[]; locals: SimpleDriveFile[] };
export type FolderProps = { ctx: SyncContext; remotes: ParsedFolderDto[]; locals: SimpleDriveFolder[] };
