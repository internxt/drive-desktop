import { paths } from '@internxt/drive-desktop-core/build/backend';
import createClient from 'openapi-fetch';

export const authClient = createClient<paths>({ baseUrl: process.env.DRIVE_URL });
