#pragma once

#include <external.h>

struct SyncRoot {
    bool allowPinning;
    bool showSiblingsAsGroup;
    uint32_t hardlinkPolicy;
    uint32_t hydrationPolicy;
    uint32_t hydrationPolicyModifier;
    uint32_t inSyncPolicy;
    uint32_t populationPolicy;
    uint32_t protectionMode;
    winrt::hstring displayNameResource;
    winrt::hstring iconResource;
    winrt::hstring id;
    winrt::hstring path;
    winrt::hstring providerId;
    winrt::hstring version;
};

template <>
struct NapiSerializer<SyncRoot> {
    static napi_value serialize(napi_env env, const SyncRoot& res)
    {
        napi_value obj;
        napi_create_object(env, &obj);

        auto napiSetHstring = [&](const char* key, const winrt::hstring& value) {
            napiSetString(env, obj, key, winrt::to_string(value).c_str());
        };

        napiSetBool(env, obj, "allowPinning", res.allowPinning);
        napiSetBool(env, obj, "showSiblingsAsGroup", res.showSiblingsAsGroup);
        napiSetHstring("displayNameResource", res.displayNameResource);
        napiSetHstring("iconResource", res.iconResource);
        napiSetHstring("id", res.id);
        napiSetHstring("path", res.path);
        napiSetHstring("providerId", res.providerId);
        napiSetHstring("version", res.version);
        napiSetUint32(env, obj, "hardlinkPolicy", res.hardlinkPolicy);
        napiSetUint32(env, obj, "hydrationPolicy", res.hydrationPolicy);
        napiSetUint32(env, obj, "hydrationPolicyModifier", res.hydrationPolicyModifier);
        napiSetUint32(env, obj, "inSyncPolicy", res.inSyncPolicy);
        napiSetUint32(env, obj, "populationPolicy", res.populationPolicy);
        napiSetUint32(env, obj, "protectionMode", res.protectionMode);

        return obj;
    }
};

inline SyncRoot getSyncRootFromPath(const std::wstring& path)
{
    auto folder = winrt::StorageFolder::GetFolderFromPathAsync(path).get();
    auto info = winrt::StorageProviderSyncRootManager::GetSyncRootInformationForFolder(folder);

    SyncRoot res;
    res.id = info.Id();
    res.providerId = winrt::to_hstring(info.ProviderId());
    res.path = info.Path().Path();
    res.version = info.Version();
    res.displayNameResource = info.DisplayNameResource();
    res.iconResource = info.IconResource();
    res.hydrationPolicy = static_cast<uint32_t>(info.HydrationPolicy());
    res.hydrationPolicyModifier = static_cast<uint32_t>(info.HydrationPolicyModifier());
    res.populationPolicy = static_cast<uint32_t>(info.PopulationPolicy());
    res.inSyncPolicy = static_cast<uint32_t>(info.InSyncPolicy());
    res.hardlinkPolicy = static_cast<uint32_t>(info.HardlinkPolicy());
    res.showSiblingsAsGroup = info.ShowSiblingsAsGroup();
    res.allowPinning = info.AllowPinning();
    res.protectionMode = static_cast<uint32_t>(info.ProtectionMode());

    return res;
}

inline napi_value getSyncRootFromPathWrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "GetSyncRootFromPathAsync", getSyncRootFromPath, std::move(path));
}

inline napi_value GetSyncRootFromPathWrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, getSyncRootFromPathWrapper);
}
