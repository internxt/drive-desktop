import { Usage } from '../../main/usage/usage';

export async function getUsage(): Promise<Usage> {
  return window.electron.getUsage();
}
