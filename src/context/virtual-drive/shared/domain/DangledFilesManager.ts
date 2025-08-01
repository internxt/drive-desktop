import { logger } from '@/apps/shared/logger/logger';

type PushAndCleanInput = {
  toUpdateContentsIds: string[];
  toDeleteContentsIds: string[];
};

class DangledFilesManager {
  // eslint-disable-next-line no-use-before-define
  private static instance: DangledFilesManager;
  private accumulate: Record<string, string> = {};
  private toDelete: string[] = [];

  public static getInstance(): DangledFilesManager {
    if (!DangledFilesManager.instance) {
      DangledFilesManager.instance = new DangledFilesManager();
    }

    return DangledFilesManager.instance;
  }

  public add(input: { contentId: string; path: string }): void {
    const { contentId, path } = input;
    logger.debug({ msg: 'Adding dangled file', contentId, path });
    this.accumulate[contentId] = path;
  }

  public async pushAndClean(pushCallback: (input: PushAndCleanInput) => Promise<void>): Promise<void> {
    await pushCallback({ toUpdateContentsIds: Object.keys(this.accumulate), toDeleteContentsIds: this.toDelete });
    this.toDelete = [];
    this.accumulate = {};
  }
}

export type { PushAndCleanInput };
export { DangledFilesManager };
