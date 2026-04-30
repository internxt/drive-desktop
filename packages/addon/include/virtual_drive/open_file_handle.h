#pragma once

#include <external.h>

inline winrt::file_handle openFileHandle(const std::wstring& path, DWORD dwDesiredAccess, bool openAsPlaceholder)
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
