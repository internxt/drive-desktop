#include <get_registered_sync_roots.h>
#include <stdafx.h>

#include <filesystem>
#include <iostream>
#include <vector>

std::vector<SyncRoots> get_registered_sync_roots()
{
    std::vector<SyncRoots> syncRootList;

    auto syncRoots = winrt::StorageProviderSyncRootManager::GetCurrentSyncRoots();

    for (auto const& info : syncRoots) {
        SyncRoots sr;
        sr.id = info.Id();
        sr.path = info.Path().Path();
        sr.displayName = info.DisplayNameResource();
        sr.version = info.Version();
        syncRootList.push_back(sr);
    }

    return syncRootList;
}
