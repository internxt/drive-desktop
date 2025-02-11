import createClient, { Middleware } from 'openapi-fetch';
import { paths } from './schema';
import { getNewApiHeaders } from '../../../apps/main/auth/service';

const middleware: Middleware = {
  async onRequest({ request }) {
    const headers = getNewApiHeaders();
    Object.entries(headers).forEach(([key, value]) => {
      request.headers.set(key, value);
    });
    return request;
  },
};

export const client = createClient<paths>({ baseUrl: `${process.env.NEW_DRIVE_URL}/drive` });

client.use(middleware);
