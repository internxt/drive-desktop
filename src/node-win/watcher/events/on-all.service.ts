import { AbsolutePath } from '@internxt/drive-desktop-core/build/backend';
import { Stats } from 'node:fs';

type Props = {
  event: string;
  path: AbsolutePath;
  stats: Stats | undefined;
};

// eslint-disable-next-line no-empty-pattern
export function onAll({}: Props) {}
