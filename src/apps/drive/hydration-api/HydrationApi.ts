import { Container } from 'diod';
import express, { Router } from 'express';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { buildHydrationRouter } from './routes/contents';
import { buildFilesRouter } from './routes/files';
import { errorHandlerMiddleware } from './controllers/middlewares/errorHandlerMiddleware';
import { Stopwatch } from '../../shared/types/Stopwatch';
import { Server } from 'http';

export interface HydrationApiOptions {
  debug: boolean;
  timeElapsed: boolean;
}

export class HydrationApi {
  private static readonly PORT = 4567;
  private readonly app;
  private server: Server | null = null;

  constructor(private readonly container: Container) {
    this.app = express();
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

    this.app.use(errorHandlerMiddleware);

    if (options.debug) {
      this.app.use((req, _res, next) => {
        logger.debug({
          msg: `[HYDRATION API] [${new Date().toLocaleString()}] ${req.method} ${req.url}`
        });
        next();
      });
    }

    if (options.timeElapsed) {
      this.app.use((req, res, next) => {
        const stopwatch = new Stopwatch();

        res.on('finish', () => {
          const duration = stopwatch.elapsedTime();
          const decodedBuffer = Buffer.from(req.params.path, 'base64');

          const path = decodedBuffer.toString('utf-8').replaceAll('%20', ' ');

          logger.debug({
            msg: `[HYDRATION API] ${req.method} ${req.originalUrl} ${path} took ${duration} ms`
          });
        });

        stopwatch.start();
        next();
      });
    }

    Object.entries(routers).forEach(([route, router]: [string, Router]) => {
      this.app.use(`/${route}`, router);
    });

    return new Promise((resolve) => {
      this.server = this.app.listen(HydrationApi.PORT, () => {
        logger.debug({
          msg: `[HYDRATION API] running on port ${HydrationApi.PORT}`
        });
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server)
        this.server.close((err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
    });
  }
}
