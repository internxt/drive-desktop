import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import Logger from 'electron-log';

export type HeadersProvider = () => Promise<Record<string, string>>;
export type UnauthorizedNotifier = () => void;

export class AuthorizedHttpClient {
  public readonly client: AxiosInstance;

  private handleUnauthorizedResponse(error: AxiosError) {
    if (error?.response?.status === 401) {
      Logger.warn('[AUTH] Request unauthorized');
      try {
        this.unauthorizedNotifier();
      } catch (error) {
        Logger.error('[AUTH] Unauthorized notifier failed', error);
      }
    }
    // Prevent the token from being displayed in the logs
    if (error.config?.headers?.Authorization) {
      error.config.headers['Authorization'] = 'Bearer ****************';
    }
    return Promise.reject(error);
  }

  private async addApplicationHeaders(config: AxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
    config.headers = await this.headersProvider();

    return config as InternalAxiosRequestConfig;
  }

  constructor(private headersProvider: HeadersProvider, private unauthorizedNotifier: UnauthorizedNotifier) {
    this.unauthorizedNotifier = unauthorizedNotifier;
    this.client = axios.create();

    this.client.interceptors.request.use(this.addApplicationHeaders.bind(this));

    this.client.interceptors.response.use((response: AxiosResponse) => {
      return response;
    }, this.handleUnauthorizedResponse.bind(this));
  }
}
