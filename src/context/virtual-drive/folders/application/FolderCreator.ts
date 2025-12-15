import { SyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Addon } from '@/node-win/addon-wrapper';
import { getParentUuid } from '../../files/application/get-parent-uuid';
import { persistFolder } from '@/infra/drive-server-wip/out/ipc-main';

type TProps = {
  ctx: SyncContext;
  path: AbsolutePath;
};

export class FolderCreator {
  static async run({ ctx, path }: TProps) {
    ctx.logger.debug({ msg: 'Create folder', path });

    const parentUuid = await getParentUuid({ ctx, path });

    const { data: folder, error } = await persistFolder({ ctx, path, parentUuid });

    if (error) throw error;

    await Addon.convertToPlaceholder({ path, placeholderId: `FOLDER:${folder.uuid}` });

    return folder.uuid;
  }
}
