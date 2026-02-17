import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '@internxt/drive-desktop-core/build/backend';
export type HeadersProvider = () => Promise<Record<string, string>>;
export type UnauthorizedNotifier = () => void;

export class AuthorizedHttpClient {
  public readonly client: AxiosInstance;

  constructor(
    private readonly headersProvider: HeadersProvider,
    private readonly unauthorizedNotifier: UnauthorizedNotifier,
  ) {
    this.client = axios.create();

    this.client.interceptors.request.use(this.addApplicationHeaders.bind(this));

    this.client.interceptors.response.use((response: AxiosResponse) => {
      return response;
    }, this.responseInterceptor.bind(this));
  }

  private responseInterceptor(error: AxiosError) {
    if (error?.response?.status === 401) {
      logger.warn({ msg: '[AUTH] Request unauthorized', url: error.config?.url });
      if (this.unauthorizedNotifier) this.unauthorizedNotifier();
    }

    // Prevent the token from being displayed in the logs
    if (error.config?.headers?.Authorization) {
      error.config.headers['Authorization'] = 'Bearer ****************';
    }
    return Promise.reject(error.message);
  }

  private async addApplicationHeaders(config: InternalAxiosRequestConfig) {
    const headers = await this.headersProvider();
    Object.assign(config.headers, headers);

    return config;
  }
}
