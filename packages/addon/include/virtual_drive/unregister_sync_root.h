#pragma once

inline napi_value unregister_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [id] = napi_extract_args<std::wstring>(env, info);

    return run_async(
        env,
        "UnregisterSyncRootAsync",
        winrt::StorageProviderSyncRootManager::Unregister,
        std::move(id));
}

inline napi_value UnregisterSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, unregister_sync_root_wrapper);
}
