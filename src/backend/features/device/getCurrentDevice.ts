import { left, right } from './../../../context/shared/domain/Either';
import { Device } from './../../../apps/main/device/service';
import { Either } from 'src/context/shared/domain/Either';
import { driveServerModule } from './../../../infra/drive-server/drive-server.module';
import { getDeviceIdentifier } from './getDeviceIdentifier';

export async function getCurrentDevice(): Promise<Either<Error, Device>> {
  const getDeviceIdentifierEither = getDeviceIdentifier();

  if (getDeviceIdentifierEither.isLeft()) {
    return left(getDeviceIdentifierEither.getLeft());
  }

  const { platform, key, hostname } = getDeviceIdentifierEither.getRight();
  if (!platform || !key || !hostname) {
    return left(new Error('Missing required device identifier fields'));
  }

  const getDeviceEither = await driveServerModule.backup.getDevicesByIdentifier({
    platform,
    key,
    hostname,
    limit: 50,
    offset: 0,
  });

  if (getDeviceEither.isLeft()) {
    return left(getDeviceEither.getLeft());
  }

  if (getDeviceEither.getRight().length > 0) {
    return left(new Error('Multiple devices found for the same identifier'));
  }

  return right(getDeviceEither.getRight()[0]);
}
