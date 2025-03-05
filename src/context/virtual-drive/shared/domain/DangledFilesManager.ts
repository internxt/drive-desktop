import Logger from 'electron-log';

class DangledFilesManager {
  private static instance: DangledFilesManager;
  private accumulate: Record<string, string> = {};
  public static getInstance(): DangledFilesManager {
    if (!DangledFilesManager.instance) {
      DangledFilesManager.instance = new DangledFilesManager();
    }

    return DangledFilesManager.instance;
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
