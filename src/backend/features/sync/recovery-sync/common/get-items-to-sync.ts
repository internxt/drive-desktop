import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { FileProps, FolderProps } from '../recovery-sync.types';
import { isItemToSync } from './is-item-to-sync';
import { SqliteModule } from '@/infra/sqlite/sqlite.module';

type Props = FileProps | FolderProps;

export async function getItemsToSync(props: FolderProps): Promise<ParsedFolderDto[]>;
export async function getItemsToSync(props: FileProps): Promise<ParsedFileDto[]>;

export async function getItemsToSync({ ctx, type, remotes, locals }: Props) {
  const { data: checkpoint } = await SqliteModule.CheckpointModule.getCheckpoint({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type,
  });

  if (!checkpoint) return [];

  const checkpointDate = new Date(checkpoint.updatedAt);

  const localsMap = new Map(locals.map((file) => [file.uuid, file]));
  const itemsToSync = remotes.filter((remote) => isItemToSync({ ctx, type, localsMap, remote, checkpointDate }));

  return itemsToSync;
}
