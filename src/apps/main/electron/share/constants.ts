export const CONTEXT_MENU_PIPE_PATH = String.raw`\\.\pipe\internxt-drive-context-menu`;

/** Windows paths are far smaller in normal use. This limit also prevents an
 * unrelated local process from making the main process buffer arbitrary data.
 */
export const MAX_MESSAGE_BYTES = 64 * 1024;
