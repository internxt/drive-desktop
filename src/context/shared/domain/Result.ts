export type Result<T, E extends Error = Error> = { data: T; error?: undefined } | { error: E; data?: undefined };

export function foldResult<T, E extends Error, R>(
  result: Result<T, E>,
  cases: {
    data: (data: T) => R;
    error: (error: E) => R;
  },
): R {
  return isError(result) ? cases.error(result.error) : cases.data(result.data);
}

function isError<T, E extends Error>(result: Result<T, E>): result is { error: E } {
  return result.error !== undefined;
}
