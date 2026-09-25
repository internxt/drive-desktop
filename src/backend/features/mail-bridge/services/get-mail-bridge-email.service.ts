import {
  createMailClient,
  MailBridgeSessionPreparationError,
  retrieveMailAccountKeys,
} from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import { Result } from '@internxt/drive-desktop-core/build/common/result';
import { obtainToken } from '@/apps/main/auth/service';
import { INTERNXT_CLIENT, INTERNXT_VERSION } from '@/core/utils/utils';

export async function getMailBridgeEmail(): Promise<Result<string, MailBridgeSessionPreparationError>> {
  try {
    const token = obtainToken();
    const mailClient = createMailClient({
      gatewayUrl: process.env.DRIVE_URL,
      clientName: INTERNXT_CLIENT,
      clientVersion: INTERNXT_VERSION,
      desktopHeader: process.env.DESKTOP_HEADER,
      token,
    });
    const result = await retrieveMailAccountKeys(mailClient.getMailAccountKeys);
    if (result.error) {
      return Result.err(result.error);
    }
    return Result.ok(result.data.address);
  } catch (error) {
    return Result.err(
      new MailBridgeSessionPreparationError(
        'mail-key-fetch-failed',
        error instanceof Error ? error.message : 'Could not retrieve Mail account email',
      ),
    );
  }
}
