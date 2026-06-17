import { logger } from '@internxt/drive-desktop-core/build/backend';
import { Container } from 'diod';
import { HydrationApi } from '../../../../apps/drive/hydration-api/HydrationApi';

let hydrationApi: HydrationApi | undefined;

type Props = {
  container: Container;
};

export async function startHydrationApi({ container }: Props) {
  if (hydrationApi) {
    return;
  }

  hydrationApi = new HydrationApi(container);
  await hydrationApi.start({ debug: false, timeElapsed: false });

  logger.debug({ msg: '[HYDRATION API] started' });
}

export async function stopHydrationApi() {
  if (!hydrationApi) {
    return;
  }

  await hydrationApi.stop();
  hydrationApi = undefined;

  logger.debug({ msg: '[HYDRATION API] stopped' });
}
