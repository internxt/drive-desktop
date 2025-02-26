import { components, paths } from '@/apps/shared/HttpClient/schema';
import { client } from '../../../shared/HttpClient/client';
import { customInspect } from '../../../shared/logger/custom-inspect';

export class FetchWorkspacesService {
  static async run(): Promise<paths['/workspaces']['get']['responses']['200']['content']['application/json']> {
    const result = await client.GET('/workspaces');
    if (!result.data) throw new Error(`Fetch workspaces response not ok with error ${customInspect(result.error)}`);
    return result.data;
  }

  static async getCredencials(workspaceId: string): Promise<components['schemas']['WorkspaceCredentialsDto']> {
    const result = await client.GET('/workspaces/{workspaceId}/credentials', {
      params: {
        path: {
          workspaceId,
        },
      },
    });
    if (!result.data) throw new Error(`Fetch workspace credentials response not ok with error ${customInspect(result.error)}`);
    return result.data;
  }
}
