import { RETRY_CONFIG_KEY } from './drive-server.constants';

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    [RETRY_CONFIG_KEY]?: number;
  }
}
