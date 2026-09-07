import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';
import { AbsolutePath } from '@/context/local/localFile/infrastructure/AbsolutePath';

type MoveAttempt = {
  move: string;
  attempts: number;
};

type Store = {
  folders: Map<FolderUuid, AbsolutePath>;
  moves: Map<string, MoveAttempt>;
};

export const store: Store = {
  folders: new Map(),
  moves: new Map(),
};

export function clearStore() {
  store.folders.clear();
  store.moves.clear();
}
