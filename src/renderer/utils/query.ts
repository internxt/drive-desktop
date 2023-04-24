import { AppQuery } from '../../main/app-info/service';
import { AvaliableMethods } from '../../main/app-info/AvaliableAppQuery';
import { StoredValues } from '../../main/config/service';

export async function queryApp(
  input: AvaliableMethods | AppQuery<AvaliableMethods>
) {
  const query =
    typeof input === 'string'
      ? ({ method: input, params: [] } as AppQuery<AvaliableMethods>)
      : input;

  return window.electron.query(query);
}

export async function getConfigKey(key: StoredValues) {
  return window.electron.getConfigKey(key);
};
