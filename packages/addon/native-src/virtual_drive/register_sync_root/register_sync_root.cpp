#include <Windows.h>
#include <async_wrapper.h>
#include <napi_extract_args.h>
#include <register_sync_root.h>
#include <stdafx.h>

#include <filesystem>
#include <iostream>
#include <vector>

void register_sync_root(const std::wstring& syncRootPath, const std::wstring& providerName,
                        const std::wstring& providerVersion, const std::wstring& providerId, const std::wstring& logoPath)
{
    winrt::StorageProviderSyncRootInfo info;
    info.Id(providerId);

    auto folder = winrt::StorageFolder::GetFolderFromPathAsync(syncRootPath).get();
    info.Path(folder);

    info.DisplayNameResource(providerName);

    std::wstring completeIconResource = std::wstring(logoPath) + L",0";
    info.IconResource(completeIconResource);

    info.HydrationPolicy(winrt::StorageProviderHydrationPolicy::Full);
    info.HydrationPolicyModifier(winrt::StorageProviderHydrationPolicyModifier::None);
    info.PopulationPolicy(winrt::StorageProviderPopulationPolicy::AlwaysFull);
    info.InSyncPolicy(winrt::StorageProviderInSyncPolicy::FileCreationTime | winrt::StorageProviderInSyncPolicy::DirectoryCreationTime);
    info.Version(providerVersion);
    info.ShowSiblingsAsGroup(false);
    info.HardlinkPolicy(winrt::StorageProviderHardlinkPolicy::None);

    winrt::Uri uri(L"https://drive.internxt.com/app/trash");
    info.RecycleBinUri(uri);

    winrt::StorageProviderSyncRootManager::Register(info);
}

napi_value register_sync_root_wrapper(napi_env env, napi_callback_info info)
{
    auto [syncRootPath, providerName, providerVersion, providerId, logoPath] =
        napi_extract_args<std::wstring, std::wstring, std::wstring, std::wstring, std::wstring>(env, info);

    register_sync_root(syncRootPath, providerName, providerVersion, providerId, logoPath);
    return nullptr;
    // return run_async(
    //     env,
    //     "RegisterSyncRootAsync",
    //     register_sync_root,
    //     std::move(syncRootPath),
    //     std::move(providerName),
    //     std::move(providerVersion),
    //     std::move(providerId),
    //     std::move(logoPath));
}
