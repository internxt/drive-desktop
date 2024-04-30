type State = boolean;

let initialSyncReady: State = false;

export function setInitialSyncState(action: 'READY' | 'NOT_READY'): State {
  switch (action) {
    case 'READY':
      initialSyncReady = true;
      return initialSyncReady;
    case 'NOT_READY':
      initialSyncReady = false;
      return initialSyncReady;
    default:
      return initialSyncReady;
  }
}

export function isInitialSyncReady(): boolean {
  return initialSyncReady;
}
