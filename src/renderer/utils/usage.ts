import { Usage } from '../../main/usage/Usage';

export async function getUsage(): Promise<Usage> {
  return window.electron.getUsage();
}
