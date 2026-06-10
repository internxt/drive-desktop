import { createServer, Server, Socket } from 'node:net';
import { win32 } from 'node:path';
import { logger } from '@/apps/shared/logger/logger';
import { CONTEXT_MENU_PIPE_PATH, MAX_MESSAGE_BYTES } from './constants';

export function parseContextMenuPath(message: Buffer) {
  /**
   * v2.6.10 Alexis Mora
   * C++ sends the path as UTF-16, which uses two bytes per code unit.
   * An odd byte count therefore means the message is incomplete or malformed.
   * The size limit prevents a local process from making Electron buffer arbitrary amounts of data.
   * Normal Windows paths are far smaller than 64 KB.
   */
  if (message.length === 0 || message.length > MAX_MESSAGE_BYTES || message.length % 2 !== 0) return null;

  /**
   * v2.6.10 Alexis Mora
   * C++ sends Windows std::wstring paths as UTF-16.
   * Decoding them directly preserves non-ASCII filenames without requiring additional serialization.
   */
  const selectedPath = message.toString('utf16le');
  if (!win32.isAbsolute(selectedPath) || selectedPath.includes('\0')) return null;

  return selectedPath;
}

export function startContextMenuPipe(onPath: (selectedPath: string) => void): Server {
  const server = createNamedPipe(onPath);

  server.on('error', (error) => {
    logger.error({ msg: 'Context-menu pipe server error', error });
  });

  server.listen(CONTEXT_MENU_PIPE_PATH, () => {
    logger.debug({ msg: 'Context-menu pipe listening', path: CONTEXT_MENU_PIPE_PATH });
  });

  return server;
}

function createNamedPipe(onPath: (selectedPath: string) => void) {
  return createServer((socket) => {
    const chunks: Buffer[] = [];
    let messageSize = 0;

    socket.on('data', (chunk: Buffer) => {
      messageSize += chunk.length;
      handleData({ chunk, messageSize, chunks, socket });
    });

    socket.on('end', () => handleEnd({ chunks, onPath }));

    socket.on('error', handleError);
  });
}

function handleData({ chunk, messageSize, chunks, socket }: { chunk: Buffer; messageSize: number; chunks: Buffer[]; socket: Socket }) {
  if (messageSize > MAX_MESSAGE_BYTES) {
    socket.destroy();
    return;
  }

  chunks.push(chunk);
}

function handleEnd({ chunks, onPath }: { chunks: Buffer[]; onPath: (selectedPath: string) => void }) {
  const selectedPath = parseContextMenuPath(Buffer.concat(chunks));
  if (!selectedPath) {
    logger.warn({ msg: 'Invalid context-menu pipe message' });
    return;
  }

  try {
    onPath(selectedPath);
  } catch (error) {
    logger.error({ msg: 'Error handling context-menu path', selectedPath, error });
  }
}

function handleError(error: Error) {
  logger.error({ msg: 'Context-menu pipe error', error });
}
