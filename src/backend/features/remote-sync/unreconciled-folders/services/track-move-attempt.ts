import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';
import { store } from '../store';

type Props = {
  uuid: string;
  from: AbsolutePath;
  to: AbsolutePath;
};

export function trackMoveAttempt({ uuid, from, to }: Props) {
  const move = `${from} -> ${to}`;
  const previous = store.moves.get(uuid);
  const attempts = previous?.move === move ? previous.attempts + 1 : 1;

  store.moves.set(uuid, { move, attempts });

  return { attempts };
}
