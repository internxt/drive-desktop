import { logger } from '@internxt/drive-desktop-core/build/backend';

export function registerProcessHandlers() {
  process.on('uncaughtException', (error) => {
    /**
     * v.2.5.1
     * Esteban Galvis Triana
     * EPIPE errors close stdout, so they must be handled specially to avoid infinite logging loops.
     */
    if ('code' in error && error.code === 'EPIPE') {
      return;
    }

    if (error.name === 'AbortError') {
      logger.debug({ msg: 'Fetch request was aborted' });
      return;
    }

    try {
      logger.error({ msg: 'Uncaught exception in main process: ', error });
    } catch {
      return;
    }
  });
}
