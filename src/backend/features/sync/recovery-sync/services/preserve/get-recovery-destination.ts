import { abs, AbsolutePath, join } from '@/context/local/localFile/infrastructure/AbsolutePath';

type Props = {
  volume: string;
  startedAt: string;
  subfolder: string;
  attempt: number;
};

/**
 * v2.7.2 Alexis Mora
 * The name uses the local time the user started the run, with seconds so two runs in the same minute get different folders.
 * Every context of a run shares the dated folder and keeps its items in its own subfolder.
 * A later attempt adds a suffix to the dated folder when its path already exists on disk and was not created by this run.
 */
export function getRecoveryDestination({ volume, startedAt, subfolder, attempt }: Props): AbsolutePath {
  const name = getRecoveryFolderName({ startedAt });
  const folder = attempt === 1 ? name : `${name} (${attempt})`;
  return join(abs(`${volume}/`), folder, subfolder);
}

function getRecoveryFolderName({ startedAt }: { startedAt: string }) {
  const date = new Date(startedAt);
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `Internxt Recovery Sync ${day} ${time}`;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}
