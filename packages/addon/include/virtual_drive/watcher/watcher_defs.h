#pragma once

#include <atomic>
#include <vector>

// A batch is the unit that crosses the native -> JavaScript boundary. This
// first safe step deliberately does not set an N-API queue limit: dropping
// notifications is not correct until the Sync engine has a tested filesystem
// reconciliation path. It reduces callback count while that larger recovery
// design is still being defined.
constexpr size_t WATCHER_NATIVE_BATCH_SIZE = 500;

struct WatcherContext {
    napi_threadsafe_function tsfn;
    std::atomic<bool> shouldStop{false};
};

struct WatcherEvent {
    std::string action;
    std::wstring path;
    std::string type;
    uint64_t internalId;
    uint64_t size;
    double ctimeMs;
    double mtimeMs;
};

struct WatcherEventBatch {
    std::vector<WatcherEvent> events;
};
