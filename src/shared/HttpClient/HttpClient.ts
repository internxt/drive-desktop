import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

export type HeadersProvider = () => Promise<Record<string, string>>;
export type UnauthorizedNotifier = () => void;

export class AuthorizedHttpClient {
  public readonly client: AxiosInstance;

  private handleUnauthorizedResponse(error: AxiosError) {
    if (error?.response?.status === 401) {
      this.unauthorizedNotifier();
    }

    return error;
  }

  private async addApplicationHeaders(config: AxiosRequestConfig) {
    config.headers = await this.headersProvider();

    return config;
  }

  constructor(
    private headersProvider: HeadersProvider,
    private unauthorizedNotifier: UnauthorizedNotifier
  ) {
    this.client = axios.create();

    this.client.interceptors.request.use(this.addApplicationHeaders.bind(this));

    this.client.interceptors.response.use((response: AxiosResponse) => {
      return response;
    }, this.handleUnauthorizedResponse.bind(this));
  }
}
