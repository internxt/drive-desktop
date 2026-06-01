import configStore from '../../../apps/main/config';
import { createBackup } from './create-backup';
import { DeviceModule } from '../device/device.module';
import { createAbsolutePath } from '../../../context/local/localFile/infrastructure/AbsolutePath';
import { Result } from '../../../context/shared/domain/Result';

type Props = {
  folderPaths: string[];
};

export async function createBackupsFromLocalPaths({ folderPaths }: Props): Promise<Result<boolean, Error>> {
  const { error, data } = await DeviceModule.getOrCreateDevice();
  if (error) return { error };

  const operations = folderPaths.map((folderPath) =>
    createBackup({ pathname: createAbsolutePath(folderPath), device: data }),
  );
  await Promise.all(operations);

  configStore.set('backupsEnabled', true);
  return { data: true };
}
