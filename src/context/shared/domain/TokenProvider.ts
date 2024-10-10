export abstract class TokenProvider {
  abstract getToken(): Promise<string>;
  abstract getNewToken(): Promise<string>;
}
