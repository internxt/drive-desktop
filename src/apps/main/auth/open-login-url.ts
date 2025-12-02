import http from 'node:http';
import { AddressInfo } from 'node:net';
import { logger } from '@internxt/drive-desktop-core/build/backend';
import { processLogin } from '../electron/deeplink/process-login';
import { shell } from 'electron';
import { DRIVE_WEB_URL } from '@/core/utils/utils';

const HOST = '127.0.0.1';

export let server: http.Server | undefined;

export function openLoginUrl() {
  server?.close();

  server = http.createServer(async (req, res) => {
    if (!req.url) return;

    const { search } = new URL(req.url, `http://${req.headers.host}`);

    try {
      await processLogin({ search });
      res.writeHead(302, { Location: `${DRIVE_WEB_URL}/auth-link-ok` });
      res.end();
    } catch (error) {
      res.writeHead(302, { Location: `${DRIVE_WEB_URL}/auth-link-error` });
      res.end();
      logger.error({ msg: 'Error handling universal link', error });
    } finally {
      server?.close();
      server = undefined;
    }
  });

  server.listen(0, () => {
    const { port } = server?.address() as AddressInfo;

    const redirectUri = Buffer.from(`http://${HOST}:${port}/callback`).toString('base64');
    const params = new URLSearchParams({ universalLink: 'true', redirectUri });
    const loginUrl = `${DRIVE_WEB_URL}/login?${params.toString()}`;

    logger.debug({ msg: 'Login url', loginUrl });
    void shell.openExternal(loginUrl);
  });
}
