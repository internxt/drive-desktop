import { Container } from 'diod';
import express, { Router } from 'express';
import { HydrationApiLogger } from './HydrationApiLogger';
import { buildHydrationRouter } from './routes/contents';
import { buildFilesRouter } from './routes/files';
import { errorHandlerMiddleware } from './controllers/middlewares/errorHandlerMiddleware';
import { Stopwatch } from '../../shared/types/Stopwatch';

export interface HydrationApiOptions {
  debug: boolean;
  timeElapsed: boolean;
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

    this.app.use(errorHandlerMiddleware);

    if (options.debug) {
      this.app.use((req, _res, next) => {
        this.logger.debug(
          `[${new Date().toLocaleString()}] ${req.method} ${req.url}`
        );
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

          this.logger.debug(
            `${req.method} ${req.originalUrl} ${path} took ${duration} ms`
          );
        });

        stopwatch.start();
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
