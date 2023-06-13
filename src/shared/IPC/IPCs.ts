import { IpcMainEvent } from 'electron';

type EventHandler = (...args: any) => any;

export type CustomIPCEvents<> = Record<string, EventHandler>;

export interface CustomIpc<
  EmitedEvents extends CustomIPCEvents,
  ListenedEvents extends CustomIPCEvents
> {
  send<Event extends keyof EmitedEvents>(
    event: Event,
    ...args: Parameters<EmitedEvents[Event]>
  ): void;

  emit(event: keyof EmitedEvents): void;

  on<Event extends keyof ListenedEvents>(
    event: Event,
    listener: (
      event: IpcMainEvent,
      ...args: Parameters<ListenedEvents[Event]>
    ) => void
  ): void;

  once<Event extends keyof ListenedEvents>(
    event: Event,
    listener: (
      event: IpcMainEvent,
      ...args: Parameters<ListenedEvents[Event]>
    ) => void
  ): void;
}
