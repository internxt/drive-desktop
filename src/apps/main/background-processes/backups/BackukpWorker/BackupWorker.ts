import { BrowserWindow } from 'electron';
import Logger from 'electron-log';
import path from 'path';

export class BackupWorker {
  private static readonly DEV_PATH =
    '../../../release/app/dist/backups/index.html';

  private static readonly PROD_PATH = `${path.join(
    __dirname,
    '..',
    'backups'
  )}/index.html`;

  private constructor(
    public readonly id: number,
    private readonly worker: BrowserWindow
  ) {}

  send(message: string, ...args: any[]) {
    if (this.worker.isDestroyed()) {
      return;
    }

    this.worker.webContents.send(message, args);
  }

  static spawn(id: number): BackupWorker {
    const worker = new BrowserWindow({
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      show: false,
    });

    worker
      .loadFile(
        process.env.NODE_ENV === 'development'
          ? BackupWorker.DEV_PATH
          : BackupWorker.PROD_PATH
      )
      .catch(Logger.error);

    return new BackupWorker(id, worker);
  }

  destroy(): void {
    if (!this.worker) {
      return;
    }

    this.worker.destroy();
  }
}
