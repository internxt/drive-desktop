import CryptoJS from 'crypto-js';
import { User } from '../../../main/types';

export function hashPassword(password: string, sKey: string): string {
  const reb = CryptoJS.enc.Hex.parse(sKey);
  const bytes = CryptoJS.AES.decrypt(
    reb.toString(CryptoJS.enc.Base64),
    window.electron.env.CRYPTO_KEY
  );

  const salt = bytes.toString(CryptoJS.enc.Utf8);
  const parsedSalt = CryptoJS.enc.Hex.parse(salt);
  const hashedPassword = CryptoJS.PBKDF2(password, parsedSalt, {
    keySize: 256 / 32,
    iterations: 10000,
  }).toString();

  const pwdBytes = CryptoJS.AES.encrypt(
    hashedPassword,
    window.electron.env.CRYPTO_KEY
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
  tfa?: string
): Promise<AccessResponse> {
  const fallbackErrorMessage = 'Error while logging in';

  let accessRes;
  try {
    accessRes = await fetch(`${window.electron.env.API_URL}/api/access`, {
      method: 'POST',
      body: JSON.stringify({ email, password, tfa }),
      headers: {
        'content-type': 'application/json',
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

  return accessRes.json();
}

export async function loginRequest(email: string): Promise<{
  sKey: string;
  tfa: boolean;
}> {
  const fallbackErrorMessage = 'Error while logging in';

  let loginRes;

  try {
    loginRes = await fetch(`${window.electron.env.API_URL}/api/login`, {
      method: 'POST',
      body: JSON.stringify({ email }),
      headers: {
        'content-type': 'application/json',
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
