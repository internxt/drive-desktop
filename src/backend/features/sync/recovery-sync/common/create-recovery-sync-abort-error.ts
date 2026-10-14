export function createRecoverySyncAbortError(): Error {
  const error = new Error('Recovery sync was aborted');
  error.name = 'AbortError';
  return error;
}
