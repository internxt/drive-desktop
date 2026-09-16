import { listenToControlMessages, type ControlMessage } from '@internxt/drive-desktop-core/build/backend/features/mail-bridge';
import type { Socket } from 'node:net';
import { createUnexpectedControlMessageError } from '../utils/create-unexpected-control-message-error';
import { isMailBridgeSyncMessage } from '../utils/is-mail-bridge-sync-message';

type ListenForMailBridgeControlMessagesProps = {
  socket: Socket;
  onControlMessage: (input: { socket: Socket; message: ControlMessage }) => void;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
};

export function listenForMailBridgeControlMessages({
  socket,
  onControlMessage,
  onUnexpectedExit,
}: ListenForMailBridgeControlMessagesProps): () => void {
  return listenToControlMessages({
    socket,
    onMessage: (message) => handleControlMessage({ message, socket, onControlMessage, onUnexpectedExit }),
    onError: (error) => onUnexpectedExit({ socket, error }),
    onClose: () => onUnexpectedExit({ socket, error: new Error('Mail Bridge control channel closed unexpectedly') }),
  });
}

function handleControlMessage({
  message,
  socket,
  onControlMessage,
  onUnexpectedExit,
}: {
  message: ControlMessage;
  socket: Socket;
  onControlMessage: (input: { socket: Socket; message: ControlMessage }) => void;
  onUnexpectedExit: (input: { socket: Socket; error: Error }) => void;
}): void {
  if (isMailBridgeSyncMessage(message)) return onControlMessage({ socket, message });
  onUnexpectedExit({ socket, error: createUnexpectedControlMessageError(message) });
}
