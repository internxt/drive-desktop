#pragma once

#include <external.h>

inline void disconnect_sync_root(CF_CONNECTION_KEY connectionKey)
{
    check_hresult("CfDisconnectSyncRoot", CfDisconnectSyncRoot(connectionKey));
}

inline napi_value disconnect_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [connectionKey] = napi_extract_args<CF_CONNECTION_KEY>(env, info);

    return run_async(env, "DisconnectSyncRootAsync", disconnect_sync_root, connectionKey);
}

inline napi_value DisconnectSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, disconnect_sync_root_wrapper);
}
