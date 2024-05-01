/**
 * Run a list of async functions in sequence
 * @param steps - List of async functions
 * @returns void
 */
export async function runner( steps: Array<() => Promise<void>> ) {
  for ( const step of steps ) {
    // run step by step
    await step();
  }
}
