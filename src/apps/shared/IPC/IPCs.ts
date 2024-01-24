import { IpcMainEvent } from 'electron';

type EventHandler = (...args: any) => any;

type CustomIPCEvents = Record<string, EventHandler>;

type NonVoidReturnHandler<T extends CustomIPCEvents> = {
  [Property in keyof T as ReturnType<T[Property]> extends void
    ? never
    : Property]: T[Property];
};

type VoidReturnHandler<T extends CustomIPCEvents> = {
  [Property in keyof T as ReturnType<T[Property]> extends void
    ? Property
    : never]: T[Property];
};

type VoidParamsHandler<T extends CustomIPCEvents> = {
  [Property in keyof T as Parameters<T[Property]> extends never[]
    ? Property
    : never]: T[Property];
};

export interface TypedIPC<
  EmittedEvents extends CustomIPCEvents,
  ListenedEvents extends CustomIPCEvents
> {
  emit(event: keyof VoidParamsHandler<EmittedEvents>): void;

  send<Event extends keyof VoidReturnHandler<EmittedEvents>>(
    event: Event,
    ...args: Parameters<VoidReturnHandler<EmittedEvents>[Event]>
  ): void;

  invoke<Event extends keyof NonVoidReturnHandler<EmittedEvents>>(
    event: Event,
    ...args: Parameters<NonVoidReturnHandler<EmittedEvents>[Event]>
  ): Promise<ReturnType<EmittedEvents[Event]>>;

  on<Event extends keyof VoidReturnHandler<ListenedEvents>>(
    event: Event,
    listener: (
      event: IpcMainEvent,
      ...args: Parameters<VoidReturnHandler<ListenedEvents>[Event]>
    ) => void
  ): void;

  once<Event extends keyof VoidReturnHandler<ListenedEvents>>(
    event: Event,
    listener: (
      event: IpcMainEvent,
      ...args: Parameters<VoidReturnHandler<ListenedEvents>[Event]>
    ) => void
  ): void;

  handle<Event extends keyof NonVoidReturnHandler<ListenedEvents>>(
    event: Event,
    listener: (
      event: IpcMainEvent,
      ...args: Parameters<NonVoidReturnHandler<ListenedEvents>[Event]>
    ) => void
  ): Promise<ReturnType<ListenedEvents[Event]>>;
}
