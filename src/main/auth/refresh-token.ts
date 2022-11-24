import Logger from 'electron-log';
import { TokenScheduler } from '../token-scheduler/TokenScheduler';
import { getNewToken, getToken, updateCredentials } from './service';
import { getClient } from '../../shared/HttpClient/main-process-client';
import { onUserUnauthorized } from './handlers';

const authorizedClient = getClient();

async function obtainTokens() {
  try {
    const res = await authorizedClient.get(
      `${process.env.API_URL}/api/user/refresh`
    );

    return res.data;
  } catch (err) {
    Logger.debug('[TOKEN] Could not obtain tokens: ', err);
  }
}

async function refreshToken() {
  const response = await obtainTokens();

  if (!response) {
    return;
  }

  const { token, newToken } = response;

  updateCredentials(token, newToken);

  return [token, newToken];
}

export async function createTokenSchedule(refreshedTokens?: Array<string>) {
  const tokens = refreshedTokens || [getToken(), getNewToken()];

  const shceduler = new TokenScheduler(5, tokens, onUserUnauthorized);
  const schedule = shceduler.schedule(refreshToken);

  if (!schedule && !refreshedTokens) {
    Logger.debug('[TOKEN] Refreshing tokens');
    createTokenSchedule(await refreshToken());
  }
}
