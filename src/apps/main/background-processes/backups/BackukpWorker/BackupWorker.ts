import { BrowserWindow } from 'electron';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import path from 'path';
import isDev from '../../../../../core/isDev/isDev';

export class BackupWorker {
  private constructor(
    public readonly id: number, // <- This id is never used
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
        devTools: isDev(),
      },
      show: false,
    });

    worker.loadFile(this.getPath()).catch((error) => {
      logger.error({ tag: 'BACKUPS', msg: 'Failed to load backup worker file', error });
    });

    // Open DevTools in development mode for debugging
    if (isDev()) {
      worker.once('ready-to-show', () => {
        worker.webContents.openDevTools();
      });
    }

    return new BackupWorker(id, worker);
  }

  destroy(): void {
    if (this.worker) {
      this.worker.destroy();
    }
  }

  private static getPath(): string {
    return isDev()
      ? path.resolve(
          process.cwd(),
          'release',
          'app',
          'dist',
          'backups',
          'index.html'
        )
      : `${path.join(__dirname, '..', 'backups')}/index.html`;
  }
}
