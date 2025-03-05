class DangledFilesManager {
    private static instance: DangledFilesManager;
    private list: string[] = [];

    private constructor() {}

    public static getInstance(): DangledFilesManager {
        if (!DangledFilesManager.instance) {
            DangledFilesManager.instance = new DangledFilesManager();
        }

        return DangledFilesManager.instance;
    }

    public get(): string[] {
        return this.list;
    }

    public set(files: string[]): void {
        this.list = files;
    }
}

export { DangledFilesManager };