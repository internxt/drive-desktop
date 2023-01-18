import { Delta, Status } from '../Deltas';

export function expectStatus(delta: Delta, status: Status) {
  return expect(delta.status).toBe(status);
}
