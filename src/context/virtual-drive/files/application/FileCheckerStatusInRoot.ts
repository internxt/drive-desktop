import { NodeWinLocalFileSystem } from '../infrastructure/NodeWinLocalFileSystem';
import { PinState } from './PlaceholderTypes';

export class FileCheckerStatusInRoot {
  constructor(private readonly localFileSystem: NodeWinLocalFileSystem) {}

  public isHydrated(paths: string[]): Record<string, boolean> {
    const fileOnlineOnly: Record<string, boolean> = {};
    for (const path of paths) {
      const placeholderStatus = this.localFileSystem.getPlaceholderStateByRelativePath(path);

      if (placeholderStatus.pinState == PinState.OnlineOnly) {
        fileOnlineOnly[path] = false;
      } else {
        fileOnlineOnly[path] = true;
      }
    }

    return fileOnlineOnly;
  }
}
