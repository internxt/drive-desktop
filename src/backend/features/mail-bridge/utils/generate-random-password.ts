import { randomBytes } from 'node:crypto';

const passwordBytes = 32;

export function generateRandomPassword(): string {
  return randomBytes(passwordBytes).toString('base64url');
}
