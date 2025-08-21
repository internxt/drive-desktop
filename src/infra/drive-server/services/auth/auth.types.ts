import { components } from '../../../../infra/schemas';

export interface RefreshTokenResponse {
  token: string;
  newToken: string;
}

export interface LoginResponse {
  hasKeys: boolean;
  sKey: string;
  tfa: boolean;
  hasKyberKeys: boolean;
  hasEccKeys: boolean;
}

export type AuthLoginResponseViewModel =
  | { success: true; data: LoginResponse }
  | { success: false; error: string };

export interface LoginAccessRequest {
  email: string;
  password: string;
  tfa?: string;
}

export interface LoginAccessResponse {
  user: components['schemas']['UserDto'];
  token: string;
  userTeam: Record<string, never>;
  newToken: string;
}

export type AuthAccessResponseViewModel =
  | { success: true; data: LoginAccessResponse }
  | { success: false; error: string };
