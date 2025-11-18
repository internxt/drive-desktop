#include <windows.h>
#include "Placeholders.h"
#include "napi_extract_args.h"

napi_value update_sync_status_wrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    Placeholders::UpdateSyncStatus(path);

    return nullptr;
}
