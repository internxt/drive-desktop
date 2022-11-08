import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import {
  getHeaders,
  getNewToken,
  getToken,
  updateCredentials,
} from '../auth/service';
import httpRequest from '../../workers/utils/http-request';

async function obtainTokens() {
  const headers = getHeaders();
  const res = await httpRequest(`${process.env.API_URL}/api/user/refresh`, {
    headers,
  });

  if (!res.ok) {
    return;
  }

  return res.json();
}

async function refreshToken() {
  const { token, newToken } = await obtainTokens();

  updateCredentials(token, newToken);

  return [token, newToken];
}

export async function createTokenSchedule(refreshedTokens?: Array<string>) {
  const tokens = refreshedTokens || [getToken(), getNewToken()];

  const shceduler = new TokenScheduler(5, tokens);
  const schedule = shceduler.schedule(refreshToken);

  if (!schedule && !refreshedTokens) {
    createTokenSchedule(await refreshToken());
  }
}
