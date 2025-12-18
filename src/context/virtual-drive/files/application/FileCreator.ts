import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { ContentsUploader } from '../../contents/application/ContentsUploader';
import { getParentUuid } from './get-parent-uuid';
import { Addon } from '@/node-win/addon-wrapper';
import { persistFile } from '@/infra/drive-server-wip/out/ipc-main';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  size: number;
};

export class FileCreator {
  static async run({ ctx, path, size }: Props) {
    const contentsId = await ContentsUploader.run({ ctx, path, size });

    ctx.logger.debug({ msg: 'File uploaded', path, contentsId, size });

    const parentUuid = await getParentUuid({ ctx, path });

    const { data: file, error } = await persistFile({ ctx, path, parentUuid, contentsId, size });

    if (error) throw error;

    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}` });
  }
}
