import { Container } from 'diod';
import express, { Router } from 'express';
import { HydrationApiLogger } from './HydrationApiLogger';
import { buildHydrationRouter } from './routes/contents';
import { buildFilesRouter } from './routes/files';

export interface HydrationApiOptions {
  debug: boolean;
}

export class HydrationApi {
  private static readonly PORT = 4567;
  private readonly app;
  private readonly logger: HydrationApiLogger;

  constructor(private readonly container: Container) {
    this.app = express();
    this.logger = new HydrationApiLogger();
  }

  private async buildRouters() {
    const routers = {
      hydration: buildHydrationRouter(this.container),
      files: buildFilesRouter(this.container),
    };

    return routers;
  }

  async start(options: HydrationApiOptions): Promise<void> {
    const routers = await this.buildRouters();

    if (options.debug) {
      this.app.use((req, _res, next) => {
        this.logger.debug(
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
        this.logger.info(`running on port ${HydrationApi.PORT}`);
        resolve();
      });
    });
  }
}
