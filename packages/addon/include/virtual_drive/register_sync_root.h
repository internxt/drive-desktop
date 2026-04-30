#pragma once

#include <external.h>

inline void register_sync_root(const std::wstring& syncRootPath, const std::wstring& providerName,
                               const std::wstring& providerVersion, const std::wstring& id, const std::wstring& logoPath)
{
    auto folder = winrt::StorageFolder::GetFolderFromPathAsync(syncRootPath).get();

    winrt::StorageProviderSyncRootInfo info;

    info.Id(id);
    info.Path(folder);
    info.Version(providerVersion);
    info.DisplayNameResource(providerName);
    info.IconResource(logoPath);
    info.HydrationPolicy(winrt::StorageProviderHydrationPolicy::Full);
    info.HydrationPolicyModifier(winrt::StorageProviderHydrationPolicyModifier::None);
    info.PopulationPolicy(winrt::StorageProviderPopulationPolicy::AlwaysFull);
    info.InSyncPolicy(winrt::StorageProviderInSyncPolicy::FileCreationTime | winrt::StorageProviderInSyncPolicy::DirectoryCreationTime);
    info.HardlinkPolicy(winrt::StorageProviderHardlinkPolicy::None);
    info.ShowSiblingsAsGroup(false);
    // Trash references are saved in regedit
    // HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\SyncRootManager
    info.RecycleBinUri(winrt::Uri(L"https://drive.internxt.com/app/trash"));

    // This adds entries here:
    // - Computer\HKEY_CURRENT_USER\Software\Classes\WOW6432Node\CLSID
    // - HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Explorer\Desktop\NameSpace
    winrt::StorageProviderSyncRootManager::Register(info);
}

inline napi_value register_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [syncRootPath, providerName, providerVersion, id, logoPath] =
        napi_extract_args<std::wstring, std::wstring, std::wstring, std::wstring, std::wstring>(env, info);

    return run_async(
        env,
        "RegisterSyncRootAsync",
        register_sync_root,
        std::move(syncRootPath),
        std::move(providerName),
        std::move(providerVersion),
        std::move(id),
        std::move(logoPath));
}

inline napi_value RegisterSyncRootWrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, register_sync_root_wrapper);
}
