import httpRequest from './http-request';

export type Usage = {
  usageInBytes: number;
  limitInBytes: number;
  isInfinite: boolean;
  offerUpgrade: boolean;
};

export async function getUsage(): Promise<Usage> {
  const headers = await window.electron.getHeaders();

  const usageRequest = httpRequest(`${window.electron.env.API_URL}/api/usage`, {
    headers,
  });
  const limitRequest = httpRequest(`${window.electron.env.API_URL}/api/limit`, {
    headers,
  });

  const [usageRes, limitRes] = await Promise.all([usageRequest, limitRequest]);

  if (!usageRes.ok || !limitRes.ok)
    throw new Error('Usage or limit request failed');

  const usageBody = await usageRes.json();
  const limitBody = await limitRes.json();

  const { total: usageInBytes } = usageBody;
  const { maxSpaceBytes: limitInBytes } = limitBody;

  return {
    usageInBytes,
    limitInBytes,
    isInfinite: limitInBytes >= 108851651149824,
    offerUpgrade: limitInBytes < 2199023255552,
  };
}
