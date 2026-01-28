#include <Windows.h>
#include <async_wrapper.h>
#include <napi_extract_args.h>
#include <node_api.h>
#include <stdafx.h>

#include <string>

napi_value unregister_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [providerId] = napi_extract_args<std::wstring>(env, info);

    return run_async(
        env,
        "UnregisterSyncRootAsync",
        winrt::StorageProviderSyncRootManager::Unregister,
        std::move(providerId));
}
