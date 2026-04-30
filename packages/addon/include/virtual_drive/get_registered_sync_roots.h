#pragma once

struct SyncRoots {
    std::wstring id;
    std::wstring path;
    std::wstring displayName;
    std::wstring version;
};

inline std::vector<SyncRoots> get_registered_sync_roots()
{
    std::vector<SyncRoots> syncRootList;

    auto syncRoots = winrt::StorageProviderSyncRootManager::GetCurrentSyncRoots();

    for (auto const& info : syncRoots) {
        auto pathStr = winrt::to_string(info.Path().Path());
        std::replace(pathStr.begin(), pathStr.end(), '\\', '/');

        SyncRoots sr;
        sr.id = info.Id();
        sr.path = winrt::to_hstring(pathStr);
        sr.displayName = info.DisplayNameResource();
        sr.version = info.Version();
        syncRootList.push_back(sr);
    }

    return syncRootList;
}

inline napi_value get_registered_sync_roots_wrapper(napi_env env, napi_callback_info args)
{
    std::vector<SyncRoots> roots = get_registered_sync_roots();

    napi_value jsArray;
    napi_create_array_with_length(env, roots.size(), &jsArray);

    for (size_t i = 0; i < roots.size(); i++) {
        napi_value obj;
        napi_create_object(env, &obj);

        napiSetWstring(env, obj, "id", roots[i].id);
        napiSetWstring(env, obj, "path", roots[i].path);
        napiSetWstring(env, obj, "displayName", roots[i].displayName);
        napiSetWstring(env, obj, "version", roots[i].version);

        napi_set_element(env, jsArray, i, obj);
    }

    return jsArray;
}

inline napi_value GetRegisteredSyncRootsWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_registered_sync_roots_wrapper);
}
