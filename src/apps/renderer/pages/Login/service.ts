import CryptoJS from 'crypto-js';
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

  const response = await window.electron.access({ email, password: hashedPassword, tfa });
  if (!response.success) {
    const errorMessage = response.error ?? fallbackErrorMessage;
    throw new Error(errorMessage);
  } else {
    const { data } = response;
    data.user.mnemonic = CryptoJS.AES.decrypt(
      CryptoJS.enc.Hex.parse(data.user.mnemonic).toString(CryptoJS.enc.Base64),
      password
    ).toString(CryptoJS.enc.Utf8);
    return data;
  }
}
