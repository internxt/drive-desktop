import { FolderUuid } from '@/apps/main/database/entities/DriveFolder';

type MoveAttempt = {
  move: string;
  attempts: number;
};

type Store = {
  folders: Map<FolderUuid, string>;
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
