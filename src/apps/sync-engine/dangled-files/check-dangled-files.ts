import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { Traverser } from '@/context/virtual-drive/items/application/Traverser';
import { checkDangledFile } from './check-dangled-file';

const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

export async function checkDangledFiles({ ctx }: { ctx: ProcessSyncContext }) {
  const { files } = await Traverser.run({ ctx });

  ctx.logger.debug({ msg: 'Checking dangled files', total: files.length });

  for (const file of files) {
    if (file.isDangledStatus === false) continue;

    const createdAt = new Date(file.createdAt).getTime();

    if (createdAt < startDate || createdAt > endDate) continue;

    const { data: fileInfo } = NodeWin.getFileInfo({ ctx, path: file.absolutePath });

    if (!fileInfo) continue;

    if (fileInfo.pinState !== PinState.AlwaysLocal) {
      ctx.logger.warn({ msg: 'Possible dangled file not hydrated', path: file.absolutePath });
      continue;
    }

    await checkDangledFile({ ctx, file });
  }
}
