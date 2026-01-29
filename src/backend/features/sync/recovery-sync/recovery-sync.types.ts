import { Checkpoint } from '@/apps/main/database/entities/checkpoint';
import { SimpleDriveFile } from '@/apps/main/database/entities/DriveFile';
import { SimpleDriveFolder } from '@/apps/main/database/entities/DriveFolder';
import { SyncContext } from '@/apps/sync-engine/config';
import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';

export type FileProps = {
  ctx: SyncContext;
  type: 'file';
  remotes: ParsedFileDto[];
  locals: SimpleDriveFile[];
  checkpoint: Checkpoint;
};

export type FolderProps = {
  ctx: SyncContext;
  type: 'folder';
  remotes: ParsedFolderDto[];
  locals: SimpleDriveFolder[];
  checkpoint: Checkpoint;
};
