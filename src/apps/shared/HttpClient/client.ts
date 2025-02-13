import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getNewApiHeaders } from '../../../apps/main/auth/service';
import { logger } from '../logger/logger';
import { onUserUnauthorized } from './background-process-clients';

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers = getNewApiHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      request.headers.set(key, value);
    });
    return request;
  },
  onResponse({ response }) {
    if (response.status === 401) {
      logger.warn({ msg: 'Request unauthorized' });
      onUserUnauthorized();
    }
  },
};

export const client = createClient<paths>({ baseUrl: `${process.env.NEW_DRIVE_URL}/drive` });

client.use(middleware);
