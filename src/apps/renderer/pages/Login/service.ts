import CryptoJS from 'crypto-js';

import packageConfig from '../../../../../package.json';
import { User } from '../../../main/types';

export function hashPassword(password: string, sKey: string): string {
  const reb = CryptoJS.enc.Hex.parse(sKey);
  const bytes = CryptoJS.AES.decrypt(
    reb.toString(CryptoJS.enc.Base64),
    process.env.CRYPTO_KEY
  );

  const salt = bytes.toString(CryptoJS.enc.Utf8);
  const parsedSalt = CryptoJS.enc.Hex.parse(salt);
  const hashedPassword = CryptoJS.PBKDF2(password, parsedSalt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();

  const pwdBytes = CryptoJS.AES.encrypt(
    hashedPassword,
    process.env.CRYPTO_KEY
  ).toString();
  const text64 = CryptoJS.enc.Base64.parse(pwdBytes);
  const encryptedHash = text64.toString(CryptoJS.enc.Hex);

  return encryptedHash;
}

export type AccessResponse = {
  newToken: string;
  token: string;
  user: User;
};

export async function accessRequest(
  email: string,
  password: string,
  hashedPassword: string,
  tfa?: string
): Promise<AccessResponse> {
  const fallbackErrorMessage = 'Error while logging in';

  let accessRes;
  try {
    accessRes = await fetch(`${process.env.API_URL}/access`, {
      method: 'POST',
      body: JSON.stringify({
        email: email.toLowerCase(),
        password: hashedPassword,
        tfa,
      }),
      headers: {
        'content-type': 'application/json',
        'internxt-client': 'drive-desktop',
        'internxt-version': packageConfig.version,
      },
    });
  } catch {
    throw new Error(fallbackErrorMessage);
  }
  if (!accessRes.ok) {
    const body = await accessRes.json();
    const errorMessage = body.error ?? fallbackErrorMessage;
    throw new Error(errorMessage);
  }

  const res: AccessResponse = await accessRes.json();

  res.user.mnemonic = CryptoJS.AES.decrypt(
    CryptoJS.enc.Hex.parse(res.user.mnemonic).toString(CryptoJS.enc.Base64),
    password
  ).toString(CryptoJS.enc.Utf8);

  return res;
}

export async function loginRequest(email: string): Promise<{
  sKey: string;
  tfa: boolean;
}> {
  const fallbackErrorMessage = 'Error while logging in';

  let loginRes;

  try {
    loginRes = await fetch(`${process.env.API_URL}/login`, {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'content-type': 'application/json',
        'internxt-client': 'drive-desktop',
        'internxt-version': packageConfig.version,
      },
    });
  } catch {
    throw new Error(fallbackErrorMessage);
  }

  const body = await loginRes.json();

  if (!loginRes.ok) {
    const errorMessage = body.error ?? 'Error while logging in';
    throw new Error(errorMessage);
  }

  return body;
}
