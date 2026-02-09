#include <Wrappers.h>
#include <node_api.h>

#include <iterator>

napi_value init(napi_env env, napi_value exports)
{
    napi_property_descriptor properties[] = {
        {"connectSyncRoot", nullptr, ConnectSyncRootWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"convertToPlaceholder", nullptr, ConvertToPlaceholderWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"createFilePlaceholder", nullptr, CreateFilePlaceholderWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"createFolderPlaceholder", nullptr, CreateFolderPlaceholderWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"dehydrateFile", nullptr, DehydrateFileWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"disconnectSyncRoot", nullptr, DisconnectSyncRootWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"getPlaceholderState", nullptr, GetPlaceholderStateWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"getRegisteredSyncRoots", nullptr, GetRegisteredSyncRootsWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"getSyncRootFromPath", nullptr, GetSyncRootFromPathWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"hydrateFile", nullptr, HydrateFileWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"registerSyncRoot", nullptr, RegisterSyncRootWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"setPinState", nullptr, SetPinStateWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"unregisterSyncRoot", nullptr, UnregisterSyncRootWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"unwatchPath", nullptr, UnwatchPathWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"updatePlaceholder", nullptr, UpdatePlaceholderWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"updateSyncStatus", nullptr, UpdateSyncStatusWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
        {"watchPath", nullptr, WatchPathWrapper, nullptr, nullptr, nullptr, napi_default, nullptr},
    };

    napi_define_properties(env, exports, std::size(properties), properties);

    return exports;
}

NAPI_MODULE(NODE_GYP_MODULE_NAME, init)
