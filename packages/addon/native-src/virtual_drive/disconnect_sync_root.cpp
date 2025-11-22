#include <SyncRoot.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <napi_extract_args.h>

napi_value disconnect_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [syncRootPath] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "DisconnectSyncRootAsync", SyncRoot::DisconnectSyncRoot, std::move(syncRootPath));
}
