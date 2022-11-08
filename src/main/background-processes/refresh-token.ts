import Logger from 'electron-log';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { getNewToken, getToken, updateCredentials } from '../auth/service';
import { getClient } from '../../shared/HttpClient/main-process-client';

const authorizedClient = getClient();

async function obtainTokens() {
  const res = await authorizedClient.get(
    `${process.env.API_URL}/api/user/refresh`
  );

  return res.data;
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
    Logger.debug('[TOKEN] Refreshing tokens');
    createTokenSchedule(await refreshToken());
  }
}
