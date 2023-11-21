import express, { Router } from 'express';
import Logger from 'electron-log';

import { buildContentsRouter } from './routes/contents';
import { DependencyContainerFactory } from './dependency-injection/DependencyContainerFactory';

export class HidratationApi {
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
    };

    return routers;
  }

  async start(): Promise<void> {
    const routers = await this.buildRouters();

    Object.entries(routers).forEach(([route, router]: [string, Router]) => {
      this.app.use(`/${route}`, router);
    });

    return new Promise((resolve) => {
      this.app.listen(HidratationApi.PORT, () => {
        Logger.info(
          `Hidratation Api is running on port ${HidratationApi.PORT}`
        );
        resolve();
      });
    });
  }
}
