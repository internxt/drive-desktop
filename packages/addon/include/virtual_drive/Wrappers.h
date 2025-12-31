#pragma once

#include <node_api.h>

napi_value ConnectSyncRootWrapper(napi_env env, napi_callback_info info);
napi_value ConvertToPlaceholderWrapper(napi_env env, napi_callback_info info);
napi_value CreateFilePlaceholderWrapper(napi_env env, napi_callback_info info);
napi_value CreateFolderPlaceholderWrapper(napi_env env, napi_callback_info info);
napi_value DehydrateFileWrapper(napi_env env, napi_callback_info info);
napi_value DisconnectSyncRootWrapper(napi_env env, napi_callback_info info);
napi_value GetPlaceholderStateWrapper(napi_env env, napi_callback_info info);
napi_value GetRegisteredSyncRootsWrapper(napi_env env, napi_callback_info info);
napi_value HydrateFileWrapper(napi_env env, napi_callback_info info);
napi_value RegisterSyncRootWrapper(napi_env env, napi_callback_info info);
napi_value SetPinStateWrapper(napi_env env, napi_callback_info info);
napi_value UnregisterSyncRootWrapper(napi_env env, napi_callback_info info);
napi_value UnwatchPathWrapper(napi_env env, napi_callback_info info);
napi_value UpdatePlaceholderWrapper(napi_env env, napi_callback_info info);
napi_value UpdateSyncStatusWrapper(napi_env env, napi_callback_info info);
napi_value WatchPathWrapper(napi_env env, napi_callback_info info);
