#pragma once

struct WatcherContext {
    napi_threadsafe_function tsfn;
    std::atomic<bool> shouldStop{false};
};

struct WatcherEvent {
    std::string type;
    std::string path;
    std::string parentUuid;
};
