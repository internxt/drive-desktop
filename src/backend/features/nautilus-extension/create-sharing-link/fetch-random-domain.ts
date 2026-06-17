import { Notification } from 'electron';
import { fetchPublicSharingDomains } from '../../../../infra/drive-server/services/sharings/services/fetch-public-sharing-domains';

export async function fetchRandomDomain() {
  const result = await fetchPublicSharingDomains();

  if (result.error) {
    throw new Error(`Error while fetching public sharing domains: ${result.error.message}`);
  }

  const domains = result.data.list;
  if (domains.length === 0) {
    new Notification({
      title: 'Sharing Link Error',
      body: 'No share domains available',
    }).show();

    return null;
  }

  const randomIndex = Math.floor(Math.random() * domains.length);

  return domains[randomIndex].replace(/\/$/, '');
}
