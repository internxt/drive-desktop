#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>

void disconnect_sync_root(CF_CONNECTION_KEY connectionKey)
{
    check_hresult("CfDisconnectSyncRoot", CfDisconnectSyncRoot(connectionKey));
}

napi_value disconnect_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [connectionKey] = napi_extract_args<CF_CONNECTION_KEY>(env, info);

    return run_async(env, "DisconnectSyncRootAsync", disconnect_sync_root, connectionKey);
}
