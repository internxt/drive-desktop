#include <Placeholders.h>
#include <Utilities.h>
#include <check_hresult.h>
#include <open_file_handle.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <stdafx.h>
#include <virtual_drive.h>
#include <winbase.h>
#include <windows.h>
#include <winrt/base.h>

#include <cctype>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <random>
#include <string>
#include <vector>

FileState Placeholders::GetPlaceholderInfo(const std::wstring& path)
{
    auto fileHandle = openFileHandle(path, FILE_READ_ATTRIBUTES, true);

    constexpr DWORD fileIdMaxLength = 400;
    constexpr DWORD infoSize = sizeof(CF_PLACEHOLDER_STANDARD_INFO) + fileIdMaxLength;

    std::vector<BYTE> buffer(infoSize);
    auto* info = reinterpret_cast<CF_PLACEHOLDER_STANDARD_INFO*>(buffer.data());

    check_hresult(
        "CfGetPlaceholderInfo",
        CfGetPlaceholderInfo(
            fileHandle.get(),
            CF_PLACEHOLDER_INFO_STANDARD,
            info,
            infoSize,
            nullptr));

    std::string placeholderId(reinterpret_cast<const char*>(info->FileIdentity), info->FileIdentityLength);

    placeholderId.erase(std::remove(placeholderId.begin(), placeholderId.end(), '\0'), placeholderId.end());

    FileState result;
    result.uuid = placeholderId.substr(placeholderId.find(':') + 1);
    result.placeholderId = placeholderId;
    result.pinState = info->PinState;
    result.inSyncState = info->InSyncState;
    result.onDiskSize = info->OnDiskDataSize.QuadPart;
    return result;
}
