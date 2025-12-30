#include <Placeholders.h>
#include <Windows.h>
#include <stdio.h>

#include <atomic>
#include <filesystem>
#include <string>
#include <vector>

struct WatcherContext {
    napi_threadsafe_function tsfn;
    std::atomic<bool> shouldStop{false};
};

struct WatcherEvent {
    std::string eventType;
    std::wstring path;
    std::string parentUuid;
};
