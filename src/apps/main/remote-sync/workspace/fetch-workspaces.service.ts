import { paths } from '../../../shared/HttpClient/schema';
import { client } from '../../../shared/HttpClient/client';
import { logger } from '../../../shared/logger/logger';

export class FetchWorkspacesService {
  static async run(): Promise<paths['/workspaces']['get']['responses']['200']['content']['application/json']> {
    try {
      const result = await client.GET('/workspaces');
      if (result.data) {
        return result.data;
      }
      throw new Error('Fetch workspaces response not ok');
    } catch (error) {
      logger.error('Fetch workspaces error', error);
      throw new Error(`Fetch workspaces response not ok with error ${error}`);
    }
  }
}
