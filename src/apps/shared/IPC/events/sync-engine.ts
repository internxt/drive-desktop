const trackedEvents = [
  'delete',
  'upload',
  'download',
  'preview',
  'move',
  'rename',
] as const;
export type TrackedEvents = Capitalize<(typeof trackedEvents)[number]>;

const trackedEventsActions = [
  'started',
  'completed',
  'aborted',
  'error',
] as const;
type TrackedProviderActions = Capitalize<(typeof trackedEventsActions)[number]>;

export type TrackedActions = `${TrackedEvents} ${TrackedProviderActions}`;

export type ErrorContext = {
  action: TrackedEvents;
  itemType: 'File' | 'Folder';
  from: string;
  root: string;
};
