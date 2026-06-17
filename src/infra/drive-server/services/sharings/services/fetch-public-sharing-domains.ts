import { Result } from '../../../../../context/shared/domain/Result';
import { driveServerClient } from '../../../client/drive-server.client.instance';
import { DriveServerError } from '../../../drive-server.error';

type ShareDomainsResponse = {
  list: string[];
};

export async function fetchPublicSharingDomains(): Promise<Result<ShareDomainsResponse, DriveServerError>> {
  const { data, error } = await driveServerClient.GET('/sharings/public/domains');

  if (error) return { error };

  return { data };
}
