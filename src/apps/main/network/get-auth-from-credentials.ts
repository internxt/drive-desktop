import { NetworkCredentials } from './requests';
import { createHash } from 'node:crypto';

export function getAuthFromCredentials({ creds }: { creds: NetworkCredentials }): { Authorization: string } {
  const username = creds.user;
  const password = sha256(Buffer.from(creds.pass)).toString('hex');
  const base64 = Buffer.from(`${username}:${password}`).toString('base64');
  return {
    Authorization: `Basic ${base64}`,
  };
}

export function sha256(input: Buffer): Buffer {
  return createHash('sha256').update(input).digest();
}
