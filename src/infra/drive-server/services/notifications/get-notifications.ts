import { Result } from '../../../../context/shared/domain/Result';
import { driveServerClient } from '../../client/drive-server.client.instance';
import { DriveServerError } from '../../drive-server.error';
import { UserNotification } from '../../out/dto';

export async function getNotifications(): Promise<Result<Array<UserNotification>, DriveServerError>> {
  return await driveServerClient.GET('/notifications');
}
