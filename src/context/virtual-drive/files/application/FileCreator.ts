import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { getParentUuid } from './get-parent-uuid';
import { Addon } from '@/node-win/addon-wrapper';
import { persistFile } from '@/infra/drive-server-wip/out/ipc-main';
import { EnvironmentFileUploader } from '@/infra/inxt-js/file-uploader/environment-file-uploader';

type Props = {
  ctx: ProcessSyncContext;
  path: AbsolutePath;
  size: number;
};

export class FileCreator {
  static async run({ ctx, path, size }: Props) {
    const contentsId = await EnvironmentFileUploader.run({
      ctx,
      size,
      path,
      abortSignal: new AbortController().signal,
    });

    if (!contentsId) return;

    ctx.logger.debug({ msg: 'File uploaded', path, contentsId, size });

    const parentUuid = await getParentUuid({ ctx, path });

    const { data: file, error } = await persistFile({ ctx, path, parentUuid, contentsId, size });

    if (error) throw error;

    await Addon.convertToPlaceholder({ path, placeholderId: `FILE:${file.uuid}` });
  }
}
