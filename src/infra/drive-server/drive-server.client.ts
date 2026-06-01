import axios, { isAxiosError } from 'axios';
import { attachRateLimiterInterceptors } from './client/interceptors/rate-limiter/attach-rate-limiter-interceptors';
import { attachAuthInterceptors } from './client/interceptors/auth/attach-auth-interceptors';
import { attachErrorLoggerInterceptor } from './client/interceptors/error-logger/attach-error-logger-interceptor';
import { Result } from '../../context/shared/domain/Result';
import { DriveServerError, mapStatusToErrorCause } from './drive-server.error';
import { ClientOptions } from './drive-server.types';

type HTTPMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

/*
 * Utility types — these extract request/response typings out of the generated
 * `paths` object. They mirror the helpers used by openapi‑fetch.
 * */

/**
 * Extracts the shape (request + responses) of a particular method `M` from
 * an endpoint schema `T` (i.e. one value of the `paths` record).
 */
type MethodShape<T, M extends HTTPMethod> = T extends Record<M, infer R> ? R : never;

/**
 * Produces a union of endpoint paths (string literals) that implement the
 * HTTP method `M`.
 *
 * Example: `PathsWithMethod<paths, 'post'>` might yield
 * `'/auth/login' | '/users/refresh' | '/auth/login/access'`.
 */
type PathsWithMethod<T, M extends HTTPMethod> = {
  [P in keyof T]: MethodShape<T[P], M> extends never ? never : P;
}[keyof T] &
  string;

/**
 * Infers the JSON request body for an endpoint. If the operation does not
 * define a request body the result is `never` (body becomes optional).
 */
type OperationRequestBody<T, P extends keyof T, M extends HTTPMethod> =
  MethodShape<T[P], M> extends {
    requestBody?: { content: { 'application/json': infer Req } };
  }
    ? Req
    : never;

/**
 * Infers the JSON response payload for status 200 or 201.
 * Extend here if your API uses 202/204 etc. for success responses.
 */
type OperationResponse<T, P extends keyof T, M extends HTTPMethod> =
  MethodShape<T[P], M> extends {
    responses: {
      200?: { content: { 'application/json': infer Res } };
      201?: { content: { 'application/json': infer Res } };
    };
  }
    ? Res
    : never;

/**
 * Infers the query parameters for an endpoint, if any.
 */
type OperationQuery<T, P extends keyof T, M extends HTTPMethod> =
  MethodShape<T[P], M> extends {
    parameters: { query: infer Q };
  }
    ? Q
    : never;

/**
 * Infers the path parameters for an endpoint, if any.
 */
type OperationPath<T, P extends keyof T, M extends HTTPMethod> =
  MethodShape<T[P], M> extends {
    parameters: { path: infer PP };
  }
    ? PP extends Record<string, string>
      ? PP
      : never
    : never;

/**
 * Options for a typed HTTP request.
 */
type RequestOptions<T, P extends keyof T, M extends HTTPMethod> = {
  path?: OperationPath<T, P, M>;
  headers?: Record<string, string>;
  query?: OperationQuery<T, P, M>;
  body?: OperationRequestBody<T, P, M>;
};

/**
 * Creates a client bound to a specific OpenAPI `paths` record.
 *
 * @template T The generated `paths` type (from openapi‑typescript).
 * @param opts The client options, including the base URL.
 * @returns an object with GET/POST/… methods, each one fully typed.
 */
export function createClient<T>(opts: ClientOptions) {
  // Strip trailing slash to avoid double // when concatenating.
  const http = axios.create({
    baseURL: opts.baseUrl.replace(/\/$/, ''),
    headers: { 'content-type': 'application/json' },
  });

  attachRateLimiterInterceptors(http);

  attachAuthInterceptors(http, {
    authHeadersProvider: opts.authHeadersProvider,
    onUnauthorized: opts.onUnauthorized,
  });

  attachErrorLoggerInterceptor(http);

  /**
   * Low‑level helper that performs the actual Axios call.
   * It preserves full typing between request and response.
   */
  async function request<M extends HTTPMethod, P extends PathsWithMethod<T, M>>(
    method: M,
    path: P,
    o?: RequestOptions<T, P, M>,
  ): Promise<Result<OperationResponse<T, P, M>, DriveServerError>> {
    let url = path as string;

    if (o?.path) {
      url = url.replace(
        /{([\w-]+)}/g, // matches {uuid}, {id} …
        (_, key: string) => {
          const value = o.path![key];
          if (value === undefined) {
            throw new Error(`Missing path param “${key}” for ${path}`);
          }
          return encodeURIComponent(value);
        },
      );
    }
    try {
      const { data } = await http.request({
        method,
        url,
        headers: o?.headers,
        params: o?.query,
        data: o?.body,
      });
      return { data };
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.message ?? error.message;
        const cause = status ? mapStatusToErrorCause(status) : 'NETWORK_ERROR';

        return { error: new DriveServerError(cause, status, message) };
      }

      return {
        error: new DriveServerError('UNKNOWN', undefined, error instanceof Error ? error.message : 'Unexpected error'),
      };
    }
  }
  return {
    GET: <P extends PathsWithMethod<T, 'get'>>(p: P, o?: RequestOptions<T, P, 'get'>) => request('get', p, o),
    POST: <P extends PathsWithMethod<T, 'post'>>(p: P, o?: RequestOptions<T, P, 'post'>) => request('post', p, o),
    PUT: <P extends PathsWithMethod<T, 'put'>>(p: P, o?: RequestOptions<T, P, 'put'>) => request('put', p, o),
    PATCH: <P extends PathsWithMethod<T, 'patch'>>(p: P, o?: RequestOptions<T, P, 'patch'>) => request('patch', p, o),
    DELETE: <P extends PathsWithMethod<T, 'delete'>>(p: P, o?: RequestOptions<T, P, 'delete'>) =>
      request('delete', p, o),
  };
}
