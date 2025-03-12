import createClient from 'openapi-fetch';
import { paths } from './schema';
import { ENV } from '@/core/env/env';

export const authClient = createClient<paths>({ baseUrl: `${ENV.NEW_DRIVE_URL}/drive` });
