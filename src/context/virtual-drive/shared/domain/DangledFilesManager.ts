class DangledFilesManager {
  private static instance: DangledFilesManager;
  private list: Map<string, string> = new Map();
  public static getInstance(): DangledFilesManager {
    if (!DangledFilesManager.instance) {
      DangledFilesManager.instance = new DangledFilesManager();
    }

    return DangledFilesManager.instance;
  }

  public get(): Map<string, string> {
    return this.list;
  }

  public set(files: Map<string, string>): void {
    this.list = files;
  }
}

export { DangledFilesManager };
