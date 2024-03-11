import Logger from 'electron-log';
import express, { Router } from 'express';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';
import { buildContentsRouter } from './routes/contents';
import { buildFilesRouter } from './routes/files';

export interface HydrationApiOptions {
  debug: boolean;
}

export class HydrationApi {
  private static readonly PORT = 4567;
  private readonly app;

  constructor() {
    this.app = express();
  }

  private async buildRouters() {
    const containerFactory = new DependencyContainerFactory();
    const container = await containerFactory.build();

    const routers = {
      contents: buildContentsRouter(container),
      files: buildFilesRouter(container),
    };

    return routers;
  }

  async start(options: HydrationApiOptions): Promise<void> {
    const routers = await this.buildRouters();

    if (options.debug) {
      this.app.use((req, _res, next) => {
        Logger.debug(
          `[${new Date().toLocaleString()}] ${req.method} ${req.url}`
        );
        next();
      });
    }

    Object.entries(routers).forEach(([route, router]: [string, Router]) => {
      this.app.use(`/${route}`, router);
    });

    return new Promise((resolve) => {
      this.app.listen(HydrationApi.PORT, () => {
        Logger.info(`Hidratation Api is running on port ${HydrationApi.PORT}`);
        resolve();
      });
    });
  }
}
