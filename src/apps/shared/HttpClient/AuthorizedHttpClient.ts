import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import Logger from 'electron-log';

export type HeadersProvider = () => Promise<Record<string, string>>;
export type UnauthorizedNotifier = () => void;
export type SyncBlockedTracker = () => Promise<void>;

export class AuthorizedHttpClient {
  public readonly client: AxiosInstance;

  constructor(
    private readonly headersProvider: HeadersProvider,
    private readonly unauthorizedNotifier: UnauthorizedNotifier,
    private readonly syncBlockedTracker: SyncBlockedTracker
  ) {
    this.client = axios.create();

    this.client.interceptors.request.use(this.addApplicationHeaders.bind(this));

    this.client.interceptors.response.use((response: AxiosResponse) => {
      return response;
    }, this.responseInterceptor.bind(this));
  }

  private responseInterceptor(error: AxiosError) {
    if (error?.response?.status === 401) {
      Logger.warn('[AUTH] Request unauthorized', error.config.url);
      if (this.unauthorizedNotifier) this.unauthorizedNotifier();
    }

    if (
      error?.response?.status !== undefined &&
      error?.response?.status >= 500
    ) {
      this.syncBlockedTracker();
    }

    // Prevent the token from being displayed in the logs
    if (error.config.headers?.Authorization) {
      error.config.headers['Authorization'] = 'Bearer ****************';
    }
    return Promise.reject(error);
  }

  private async addApplicationHeaders(config: AxiosRequestConfig) {
    config.headers = await this.headersProvider();

    return config;
  }
}
