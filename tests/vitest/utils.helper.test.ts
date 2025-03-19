// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMockCalls(object: { mock: { calls: any[] } }) {
  return object.mock.calls.map((call) => call[0]);
}
