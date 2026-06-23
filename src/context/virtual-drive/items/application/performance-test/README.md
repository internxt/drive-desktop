# Placeholder traverser performance test

This benchmark uses one heterogeneous tree with the same order of magnitude as the largest reported account:

- 205,958 files, one third of the largest reported account;
- 18,602 folders, one third of the largest reported account;
- a 17-level deep folder spine, producing a path close to the traditional 260-character Windows limit with the generated folder names;
- remaining folders distributed directly below the root;
- three hotspot folders with at least 30,000 files each;
- remaining files distributed evenly across the folders.

The dataset is generated in memory. Placeholder operations are stubbed so the result primarily measures hierarchy lookup, promise scheduling, path construction, and traversal memory. It does not measure SQLite loading, `loadInMemoryPaths`, disk enumeration, or native Cloud Files API calls.

The benchmark invokes the production `Traverser.ts` implementation once.

Metrics include duration, total CPU time, peak JavaScript heap, peak process RSS, GC count and duration, and maximum event-loop delay. Memory is sampled every 25 ms.

Run it explicitly because the current repeated-filter implementation can take a long time or exhaust memory:

```powershell
npm run perf:traverser
```

The tree is configurable through `CUSTOMER_SCALE_TREE` in `run-benchmark.ts`.

## Change priority

1. **Index children by `parentUuid` once.** Build maps for child files and folders before traversal. This removes a full scan of both arrays for every folder and changes the dominant work from approximately `O(Folders × Items)` to `O(Items)`.

2. **Bound queued file work.** `pLimit(20)` limits active operations, but `Promise.all(files.map(...))` still allocates one promise and closure per file. Use bounded batches or a worker queue for 30,000-file folders.

3. **Prevent overlapping refreshes.** Serialize placeholder refreshes per workspace, particularly during startup when the initial refresh can overlap the immediately scheduled remote sync.

4. **Use iterative folder traversal with cycle detection.** An explicit stack or queue gives predictable depth behavior and prevents malformed parent cycles from running indefinitely.

5. **Reduce simultaneous dataset retention.** After fixing the dominant algorithm, reduce selected database columns and release temporary arrays and maps as early as possible.

6. **Instrument the complete refresh path.** Measure database loading, filesystem scanning, indexing, traversal, and native placeholder operations separately.

For before/after comparisons, record traversal duration, heap, RSS, and retained memory after explicit garbage collection. Use the same machine, Node version, build, and power profile.
