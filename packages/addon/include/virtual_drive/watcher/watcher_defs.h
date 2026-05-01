#pragma once

struct WatcherContext {
    napi_threadsafe_function tsfn;
    std::atomic<bool> shouldStop{false};
};

struct WatcherEvent {
    std::string action;
    std::wstring path;
    std::string type;
    uint64_t internalId;  // Internal fileId
    uint64_t size;
    double ctimeMs;  // LastChangeTime as Unix milliseconds
    double mtimeMs;  // LastModificationTime as Unix milliseconds
};
