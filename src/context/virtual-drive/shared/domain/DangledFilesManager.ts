import Logger from 'electron-log';

class DangledFilesManager {
  private static instance: DangledFilesManager;
  private accumulate: Record<string, string> = {};
  private remoteDangledFiles: string[] = [];
  private discardedDangledFiles: string[] = [];
  private toCheckDangledFiles: string[] = [];

  public static getInstance(): DangledFilesManager {
    if (!DangledFilesManager.instance) {
      DangledFilesManager.instance = new DangledFilesManager();
    }

    return DangledFilesManager.instance;
  }

  public addToCheckDangledFiles(id: string): void {
    this.toCheckDangledFiles.push(id);
  }

  // eslint-disable-next-line max-len
  public async addDiscardedDangledFiles(id: string, callback: (hydratedFilesIds: string[], remoteDangledFiles: string[]) => Promise<void>): Promise<void> {
    this.discardedDangledFiles.push(id);
    const partialCheckedDangledFilesLength = this.discardedDangledFiles.length + this.remoteDangledFiles.length;
    if (partialCheckedDangledFilesLength === this.toCheckDangledFiles.length) {
      Logger.debug('All dangled files checked in DiscardedDangledFiles');
      await callback(this.toCheckDangledFiles, this.remoteDangledFiles);
    }
  }

  public getRemoteDangledFiles(): string[] {
    return this.remoteDangledFiles;
  }

  // eslint-disable-next-line max-len
  public async addRemoteDangledFiles(id: string, callback: (hydratedFilesIds: string[], remoteDangledFiles: string[]) => Promise<void>): Promise<void> {
    this.remoteDangledFiles.push(id);
    const partialCheckedDangledFilesLength = this.discardedDangledFiles.length + this.remoteDangledFiles.length;
    if (partialCheckedDangledFilesLength === this.toCheckDangledFiles.length) {
      Logger.debug('All dangled files checked');
      await callback(this.toCheckDangledFiles, this.remoteDangledFiles);
    }
  }

  public get() {
    return this.accumulate;
  }

  public add(contentId: string, path: string): void {
    Logger.debug(`Adding dangled file: ${contentId} - ${path}`);
    this.accumulate[contentId] = path;
  }

  public set(files: Record<string, string>): void {
    this.accumulate = files;
  }
}

export { DangledFilesManager };
