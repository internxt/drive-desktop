import { ParsedFileDto, ParsedFolderDto } from '@/infra/drive-server-wip/out/dto';
import { FileProps, FolderProps } from '../recovery-sync.types';
import { CheckpointsModule } from '@/infra/lokijs/databases/checkpoints/checkpoints.module';
import { isItemToSync } from './is-item-to-sync';

type Props = FileProps | FolderProps;

export async function getItemsToSync(props: FolderProps): Promise<ParsedFolderDto[]>;
export async function getItemsToSync(props: FileProps): Promise<ParsedFileDto[]>;
export async function getItemsToSync({ ctx, type, remotes, locals }: Props) {
  const { data: checkpoint } = await CheckpointsModule.getCheckpoint({
    userUuid: ctx.userUuid,
    workspaceId: ctx.workspaceId,
    type,
  });

  if (!checkpoint) return [];

  const checkpointDate = new Date(checkpoint);

  const localsMap = new Map(locals.map((file) => [file.uuid, file]));
  const itemsToSync = remotes.filter((remote) => isItemToSync({ ctx, localsMap, remote, checkpointDate }));

  return itemsToSync;
}
