import { PinState } from '@/node-win/types/placeholder.type';
import { Stats } from 'fs';

type Props = {
  stats: Stats;
  pinState: PinState;
};

export function isHydrationPending({ stats, pinState }: Props) {
  if (pinState === PinState.AlwaysLocal) {
    const expectedBlocks = Math.ceil(stats.size / 512);
    const actualBlocks = stats.blocks;
    const ratio = actualBlocks / expectedBlocks;
    return ratio < 1;
  }

  return false;
}
