import { measurePerfomance } from '@/core/utils/measure-performance';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { logFileExplorer } from './log-file-explorer';
import { workers } from '@/apps/main/remote-sync/store';

export async function logFileExplorers() {
  const csvPaths: AbsolutePath[] = [];

  logger.debug({ msg: 'Log file explorers' });

  const time = await measurePerfomance(async () => {
    await Promise.all(
      workers.values().map(async ({ ctx }) => {
        try {
          const csvPath = await logFileExplorer({ ctx });
          csvPaths.push(csvPath);
        } catch (error) {
          ctx.logger.error({
            msg: 'Error generating file explorer csv',
            path: ctx.rootPath,
            error,
          });
        }
      }),
    );
  });

  logger.debug({ msg: 'Finish log file explorers in seconds', time });

  return csvPaths;
}
