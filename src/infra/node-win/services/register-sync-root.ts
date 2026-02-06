import { SyncContext } from '@/apps/sync-engine/config';
import { Addon } from '@/node-win/addon-wrapper';

export class RegisterSyncRootError extends Error {
  constructor(
    public readonly code: 'ACCESS_DENIED' | 'UNKNOWN',
    cause?: unknown,
  ) {
    super(code, { cause });
  }
}

type TProps = {
  ctx: SyncContext;
};

export async function registerSyncRoot({ ctx }: TProps) {
  try {
    await Addon.registerSyncRoot({
      rootPath: ctx.rootPath,
      providerId: ctx.providerId,
      providerName: ctx.providerName,
    });

    return;
  } catch (error) {
    ctx.logger.error({ msg: 'Error registering sync root', error });

    if (typeof error === 'string' && error.includes('0x80070005')) {
      return new RegisterSyncRootError('ACCESS_DENIED', error);
    }

    return new RegisterSyncRootError('UNKNOWN', error);
  }
}
