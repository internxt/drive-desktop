import { logger } from '@/apps/shared/logger/logger';
import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { overwriteDangledContents } from './overwrite-dangled-files';

const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

export async function checkDangledFiles({ ctx }: { ctx: ProcessSyncContext }) {
  const { files } = await Traverser.run({ ctx });

  logger.debug({ msg: 'Dangled files checking', total: files.length });

  const dangledFiles = files.filter((file) => {
    if (file.isDangledStatus === false) return false;

    const createdAt = new Date(file.createdAt).getTime();

    if (createdAt < startDate || createdAt > endDate) return false;

    const { data: fileInfo } = NodeWin.getFileInfo({ ctx, path: file.absolutePath });

    if (!fileInfo) return false;

    if (fileInfo.pinState !== PinState.AlwaysLocal) {
      ctx.logger.warn({ msg: 'Dangled file is not hydrated', path: file.absolutePath });
      return false;
    }

    return true;
  });

  ctx.logger.debug({ msg: 'Dangled files', paths: dangledFiles.map((file) => file.absolutePath) });

  await overwriteDangledContents({ ctx, dangledFiles });
}
