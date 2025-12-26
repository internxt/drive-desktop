import { ProcessSyncContext } from '@/apps/sync-engine/config';
import { NodeWin } from '@/infra/node-win/node-win.module';
import { PinState } from '@/node-win/types/placeholder.type';
import { checkDangledFile } from './check-dangled-file';
import { ExtendedDriveFile } from '@/apps/main/database/entities/DriveFile';

const startDate = new Date('2025-02-19T12:40:00.000Z').getTime();
const endDate = new Date('2025-03-04T14:00:00.000Z').getTime();

type Props = {
  ctx: ProcessSyncContext;
  file: ExtendedDriveFile;
};

export async function checkDangledFiles({ ctx, file }: Props) {
  if (file.isDangledStatus === false) return;

  const createdAt = new Date(file.createdAt).getTime();

  if (createdAt < startDate || createdAt > endDate) return;

  const { data: fileInfo } = await NodeWin.getFileInfo({ path: file.absolutePath });

  if (!fileInfo) return;

  if (fileInfo.pinState !== PinState.AlwaysLocal) {
    ctx.logger.warn({ msg: 'Possible dangled file not hydrated', path: file.absolutePath });
    return;
  }

  await checkDangledFile({ ctx, file });
}
