import { obtainToken } from '../../../../apps/main/auth/service';
import { TokenProvider } from '../../domain/TokenProvider';

export class MainProcessTokenProvider implements TokenProvider {
  getToken(): Promise<string> {
    return Promise.resolve(obtainToken('bearerToken'));
  }

  getNewToken(): Promise<string> {
    return Promise.resolve(obtainToken('newToken'));
  }
}
