import { Traverser } from '@/apps/backups/remote-tree/traverser';
import { downloadFile } from './download-file';
import { AbsolutePath, logger } from '@internxt/drive-desktop-core/build/backend';
import { User } from '@/apps/main/types';
import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { Device } from '@/apps/main/device/service';
import { broadcastToWindows } from '@/apps/main/windows';
import { ContentsDownloader } from '@/infra/inxt-js';

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

    broadcastToWindows({
      name: 'backup-download-progress',
      data: { id: device.uuid, progress },
    });
  }

  const tree = await Traverser.run({ rootPath, rootUuid, userUuid: user.uuid });

  const files = Object.values(tree.files);

  let downloadedItems = 0;

  updateProgress(1);

  for (const file of files) {
    if (abortController.signal.aborted) return;

    await downloadFile({ file, contentsDownloader });

    downloadedItems += 1;
    const progress = (downloadedItems / files.length) * 100;
    updateProgress(Math.trunc(progress));
  }
}
