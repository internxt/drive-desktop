#include <Windows.h>
#include "napi_extract_args.h"
#include "register_sync_root.h"

napi_value register_sync_root_wrapper(napi_env env, napi_callback_info info) {
    auto [syncRootPath, providerName, providerVersion, providerId, logoPath] =
        napi_extract_args<std::wstring, std::wstring, std::wstring, std::wstring, std::wstring>(env, info);

    register_sync_root(syncRootPath.c_str(), providerName.c_str(), providerVersion.c_str(), providerId.c_str(), logoPath.c_str());

    return nullptr;
}
