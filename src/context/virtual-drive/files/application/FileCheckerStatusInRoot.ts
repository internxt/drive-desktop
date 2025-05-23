import { PinState } from '@/node-win/types/placeholder.type';
import VirtualDrive from '@/node-win/virtual-drive';

export class FileCheckerStatusInRoot {
  constructor(private readonly virtualDrive: VirtualDrive) {}

  public isHydrated(paths: string[]): Record<string, boolean> {
    const fileOnlineOnly: Record<string, boolean> = {};
    for (const path of paths) {
      const placeholderStatus = this.virtualDrive.getPlaceholderState({ path });

      if (placeholderStatus.pinState == PinState.OnlineOnly) {
        fileOnlineOnly[path] = false;
      } else {
        fileOnlineOnly[path] = true;
      }
    }

    return fileOnlineOnly;
  }
}
