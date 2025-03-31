import { client } from '@/apps/shared/HttpClient/client';
import { ClientWrapperService } from '../in/client-wrapper.service';

export class WorkspacesService {
  constructor(private readonly clientWrapper = new ClientWrapperService()) {}

  async getWorkspaces() {
    const promise = client.GET('/workspaces');

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get workspaces request was not successful',
        attributes: {
          method: 'GET',
          endpoint: '/workspaces',
        },
      },
    });
  }

  async getCredentials({ workspaceId }: { workspaceId: string }) {
    const promise = client.GET('/workspaces/{workspaceId}/credentials', {
      params: { path: { workspaceId } },
    });

    return this.clientWrapper.run({
      promise,
      loggerBody: {
        msg: 'Get workspace credentials request was not successful',
        context: {
          workspaceId,
        },
        attributes: {
          method: 'GET',
          endpoint: '/workspaces/{workspaceId}/credentials',
        },
      },
    });
  }
}
