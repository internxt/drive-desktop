import { StoredValues } from '../../main/config/service';

export async function getConfigKey(key: StoredValues) {
  return window.electron.getConfigKey(key);
}
