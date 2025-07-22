import createClient from 'openapi-fetch';
import { paths } from './schema';

export const authClient = createClient<paths>({ baseUrl: process.env.DRIVE_URL });
