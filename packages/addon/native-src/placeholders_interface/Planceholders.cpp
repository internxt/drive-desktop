#include <Placeholders.h>
#include <Utilities.h>
#include <check_hresult.h>
#include <convert_to_placeholder.h>
#include <shlobj.h>
#include <shlwapi.h>
#include <stdafx.h>
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

winrt::file_handle Placeholders::OpenFileHandle(const std::wstring& path, DWORD dwDesiredAccess, bool openAsPlaceholder)
{
    bool isDirectory = std::filesystem::is_directory(path);

    DWORD dwFlagsAndAttributes = 0;
    if (openAsPlaceholder)
        dwFlagsAndAttributes |= FILE_FLAG_OPEN_REPARSE_POINT;
    if (isDirectory)
        dwFlagsAndAttributes |= FILE_FLAG_BACKUP_SEMANTICS;

    winrt::file_handle fileHandle{CreateFileW(
        path.c_str(),
        dwDesiredAccess,
        FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE,
        nullptr,
        OPEN_EXISTING,
        dwFlagsAndAttributes,
        nullptr)};

    if (!fileHandle) {
        // https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-
        throw std::runtime_error("Failed to open file handle: " + std::to_string(GetLastError()));
    }

    return fileHandle;
}

FileState Placeholders::GetPlaceholderInfo(const std::wstring& path)
{
    auto fileHandle = OpenFileHandle(path, FILE_READ_ATTRIBUTES, true);

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
