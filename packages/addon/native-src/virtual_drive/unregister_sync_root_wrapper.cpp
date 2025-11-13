#include <windows.h>
#include <node_api.h>
#include <string>
#include "napi_extract_args.h"
#include "stdafx.h"

napi_value unregister_sync_root_wrapper(napi_env env, napi_callback_info info) {
    auto [providerId] = napi_extract_args<std::wstring>(env, info);

    winrt::StorageProviderSyncRootManager::Unregister(providerId);

    return nullptr;
}
