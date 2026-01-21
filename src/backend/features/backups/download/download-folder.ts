import { Traverser } from '@/apps/backups/remote-tree/traverser';
import { downloadFile } from './download-file';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { User } from '@/apps/main/types';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Device } from '@/apps/main/device/service';
import { broadcastToWindows } from '@/apps/main/windows';
import { ContentsDownloader } from '@/infra/inxt-js';
import Bottleneck from 'bottleneck';
import { mkdir } from 'node:fs/promises';
import { isBottleneckStop } from '@/infra/drive-server-wip/in/helpers/error-helpers';

type Props = {
  user: User;
  device: Device;
  rootUuid: FolderUuid;
  rootPath: AbsolutePath;
  abortController: AbortController;
  contentsDownloader: ContentsDownloader;
};

export async function downloadFolder({ user, device, rootUuid, rootPath, abortController, contentsDownloader }: Props) {
  function updateProgress(progress: number) {
    if (abortController.signal.aborted) return;

    logger.debug({ tag: 'BACKUPS', msg: 'Download folder progress', progress });

    broadcastToWindows({ name: 'backup-download-progress', data: { id: device.uuid, progress } });
  }

  const tree = await Traverser.run({ rootPath, rootUuid, userUuid: user.uuid });
  const files = [...tree.files.values()];
  const folders = [...tree.folders.values()];

  let downloadedItems = 0;

  const limiter = new Bottleneck({ maxConcurrent: 3 });
  const runningFiles = new Set<AbsolutePath>();

  abortController.signal.addEventListener('abort', async () => {
    await limiter.stop();
  });

  updateProgress(1);

  await Promise.all(folders.map((folder) => mkdir(folder.absolutePath, { recursive: true })));

  const promises = files.map(async (file) => {
    await limiter.schedule(async () => {
      runningFiles.add(file.absolutePath);
      await downloadFile({ file, contentsDownloader });
      runningFiles.delete(file.absolutePath);

      downloadedItems += 1;
      const progress = (downloadedItems / files.length) * 100;
      updateProgress(Math.max(progress, 1));
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    if (isBottleneckStop({ error })) {
      for (const path of runningFiles) {
        contentsDownloader.forceStop({ path });
      }
    } else {
      throw error;
    }
  }
}
