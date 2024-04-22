import { TokenProvider } from '../../domain/TokenProvider';
import { ipcRenderer } from 'electron';
import { Service } from 'diod';

@Service()
export class BackgroundProcessTokenProvider implements TokenProvider {
  getToken(): Promise<string> {
    return ipcRenderer.invoke('get-token');
  }

  getNewToken(): Promise<string> {
    return ipcRenderer.invoke('get-new-token');
  }
}
