/**
 * Adds the Bridge's startup stderr to an exit error when it is available.
 */
export function createBridgeExitError({ message, getStartupError }: { message: string; getStartupError: () => string | undefined }): Error {
  const startupError = getStartupError();
  return new Error(startupError ? `${message}: ${startupError}` : message);
}
