#include <stdafx.h>
#include <Placeholders.h>
#include <winrt/base.h>
#include <shlwapi.h>
#include <vector>
#include <filesystem>
#include <fstream>
#include <random>
#include <iostream>
#include <Utilities.h>
#include <winbase.h>
#include <string>
#include <cctype>
#include <windows.h>
#include <shlobj.h>
#include <convert_to_placeholder.h>
#include <check_hresult.h>

winrt::file_handle Placeholders::OpenFileHandle(const std::wstring &path, DWORD dwDesiredAccess, bool openAsPlaceholder)
{
    bool isDirectory = std::filesystem::is_directory(path);

    DWORD dwFlagsAndAttributes = 0;
    if (openAsPlaceholder)
        dwFlagsAndAttributes |= FILE_FLAG_OPEN_REPARSE_POINT;
    if (isDirectory)
        dwFlagsAndAttributes |= FILE_FLAG_BACKUP_SEMANTICS;

    DWORD dwShareMode = FILE_SHARE_READ | FILE_SHARE_WRITE | FILE_SHARE_DELETE;

    winrt::file_handle fileHandle{CreateFileW(
        path.c_str(),
        dwDesiredAccess,
        dwShareMode,
        nullptr,
        OPEN_EXISTING,
        dwFlagsAndAttributes,
        nullptr)};

    if (!fileHandle)
    {
        throw std::runtime_error("Failed to open file handle: " + std::to_string(GetLastError()));
    }

    return fileHandle;
}

void Placeholders::UpdateSyncStatus(const std::wstring &path)
{
    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    check_hresult(
        "CfSetInSyncState",
        CfSetInSyncState(
            fileHandle.get(),
            CF_IN_SYNC_STATE_IN_SYNC,
            CF_SET_IN_SYNC_FLAG_NONE,
            nullptr));

    SHChangeNotify(SHCNE_UPDATEITEM, SHCNF_PATH, path.c_str(), nullptr);
}

void Placeholders::UpdateFileIdentity(const std::wstring &path, const std::wstring &placeholderId)
{
    auto fileHandle = OpenFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    check_hresult(
        "CfUpdatePlaceholder",
        CfUpdatePlaceholder(
            fileHandle.get(),
            nullptr,
            placeholderId.c_str(),
            static_cast<DWORD>(placeholderId.size() * sizeof(wchar_t)),
            nullptr,
            0,
            CF_UPDATE_FLAG_NONE,
            nullptr,
            nullptr));
}

FileState Placeholders::GetPlaceholderInfo(const std::wstring &path)
{
    auto fileHandle = OpenFileHandle(path, FILE_READ_ATTRIBUTES, true);

    constexpr DWORD fileIdMaxLength = 400;
    constexpr DWORD infoSize = sizeof(CF_PLACEHOLDER_BASIC_INFO) + fileIdMaxLength;

    std::vector<char> buffer(infoSize);
    auto *info = reinterpret_cast<CF_PLACEHOLDER_BASIC_INFO *>(buffer.data());

    check_hresult(
        "CfGetPlaceholderInfo",
        CfGetPlaceholderInfo(
            fileHandle.get(),
            CF_PLACEHOLDER_INFO_BASIC,
            info,
            infoSize,
            nullptr));

    std::string placeholderId(reinterpret_cast<const char *>(info->FileIdentity), info->FileIdentityLength);

    placeholderId.erase(std::remove(placeholderId.begin(), placeholderId.end(), '\0'), placeholderId.end());

    return FileState{placeholderId, info->PinState};
}
