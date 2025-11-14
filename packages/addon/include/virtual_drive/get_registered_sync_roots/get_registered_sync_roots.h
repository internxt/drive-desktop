#pragma once

#include <iostream>
#include <vector>

struct SyncRoots
{
    std::wstring id;
    std::wstring path;
    std::wstring displayName;
    std::wstring version;
};

std::vector<SyncRoots> get_registered_sync_roots();
