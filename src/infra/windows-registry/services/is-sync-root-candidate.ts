import { z } from 'zod';

const uuidSchema = z.guid();

export function isSyncRootCandidate(id: string): boolean {
  /**
   * v2.7.0
   * Alexis Mora
   * We use bare UUIDs. Candidate ids must have UUID syntax, without restricting their version.
   */
  const uuid = id.startsWith('{') && id.endsWith('}') ? id.slice(1, -1) : id;
  return uuidSchema.safeParse(uuid).success;
}
