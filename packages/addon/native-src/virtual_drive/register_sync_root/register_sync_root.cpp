#include "Callbacks.h"
#include "SyncRoot.h"
#include "stdafx.h"
#include <filesystem>
#include <iostream>
#include <vector>

void register_sync_root(const wchar_t *syncRootPath, const wchar_t *providerName, const wchar_t *providerVersion, const wchar_t *providerId, const wchar_t *logoPath)
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
