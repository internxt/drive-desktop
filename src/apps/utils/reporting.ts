import { ErrorDetails } from '../shared/types';

export function createErrorDetails(
  originalError: any,
  action: string,
  additionalInfo?: string
): ErrorDetails {
  const { message, code, stack, errno, syscall, info } = originalError;

  return { message, code, stack, errno, syscall, info, action, additionalInfo };
}

export async function serializeRes(
  res: Pick<Response, 'status' | 'text'>
): Promise<string> {
  const data = {
    status: res.status,
    body: await res.text(),
  };

  return JSON.stringify(data, null, 2);
}
