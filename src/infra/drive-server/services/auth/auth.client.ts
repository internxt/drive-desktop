import { paths } from '../../../schemas';
import { createClient } from '../../drive-server.client';

export const authClient = createClient<paths>({
  baseUrl: process.env.NEW_DRIVE_URL || '',
});
