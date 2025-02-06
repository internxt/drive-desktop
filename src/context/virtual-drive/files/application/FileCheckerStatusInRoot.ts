import Logger from 'electron-log';
import { PlaceholderState } from '../domain/PlaceholderState';
import {
  PinState,
  SyncState,
} from '../../../../apps/shared/types/PlaceholderStates';
import fs from 'fs';
import { DependencyInjectionLocalRootFolderPath } from '../../../../apps/sync-engine/dependency-injection/common/localRootFolderPath';
import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';

export class FileCheckerStatusInRoot {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}
  async run() {
    const rootFolderPath = DependencyInjectionLocalRootFolderPath.get();
    const itemsOfRoot = await this.getItemsRoot(rootFolderPath);
    const status = await this.checkSync(itemsOfRoot);
    return status;
  }

  private async checkSync(itemsOfRoot: string[]) {
    let finalStatus = 'SYNCED';
    for (const path of itemsOfRoot) {
      const placeholderStatus =
        (await this.localFileSystem.getPlaceholderStateByRelativePath(
          path
        )) as PlaceholderState;

      const ps = placeholderStatus.pinState;
      const ss = placeholderStatus.syncState;
      const notSynced =
        ps &&
        ss &&
        ps !== PinState.AlwaysLocal &&
        ps !== PinState.OnlineOnly &&
        ss !== SyncState.InSync;

      if (notSynced) {
        Logger.debug(
          `[File Checker Status In Root] item ${path} with status: ${notSynced}`
        );
        finalStatus = 'SYNC_PENDING';
        break;
      }
    }
    return finalStatus;
  }

  private async getItemsRoot(absolutePath: string): Promise<string[]> {
    const items = fs.readdirSync(absolutePath);
    return items;
  }
}
