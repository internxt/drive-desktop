export type Result<T, E extends Error = Error> =
  | { data: T; error?: undefined }
  | { error: E; data?: undefined };
