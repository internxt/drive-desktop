#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>
#include <stdio.h>
#include <windows.h>

#include <filesystem>
#include <vector>

std::optional<std::string> GetParentPlaceholderId(const std::wstring& path, const std::wstring& rootPath, const std::string rootUuid)
{
    std::wstring parentPath = std::filesystem::path(path).parent_path().wstring();

    if (parentPath == rootPath) {
        return rootUuid;
    }

    try {
        auto fileState = Placeholders::GetPlaceholderInfo(parentPath);
        return fileState.placeholderId;
    } catch (...) {
        return std::nullopt;
    }
}

void watch_path(const std::wstring& rootPath, const std::wstring& rootUuid)
{
    auto hDirectory = Placeholders::OpenFileHandle(rootPath.c_str(), FILE_LIST_DIRECTORY, false);

    BYTE buffer[4096];

    std::string rootUuidStr(rootUuid.begin(), rootUuid.end());

    while (true) {
        DWORD bytesReturned = 0;

        BOOL success = ReadDirectoryChangesW(
            hDirectory.get(),
            buffer,
            sizeof(buffer),
            TRUE,
            FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_DIR_NAME | FILE_NOTIFY_CHANGE_SIZE | FILE_NOTIFY_CHANGE_ATTRIBUTES,
            &bytesReturned,
            nullptr,
            nullptr);

        if (!success) {
            wprintf(L"ReadDirectoryChangesW failed: %lu\n", GetLastError());
            break;
        }

        FILE_NOTIFY_INFORMATION* fni = (FILE_NOTIFY_INFORMATION*)buffer;

        while (true) {
            std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
            std::wstring path = rootPath + L"\\" + filename;

            switch (fni->Action) {
                case FILE_ACTION_ADDED: {
                    auto parentPlaceholderId = GetParentPlaceholderId(path, rootPath, rootUuidStr);
                    if (parentPlaceholderId) {
                        wprintf(L"ADDED: %s (parent placeholder: %S)\n", path.c_str(), parentPlaceholderId->c_str());
                    }
                    break;
                }
                case FILE_ACTION_REMOVED:
                    wprintf(L"REMOVED: %s\n", path.c_str());
                    break;
                case FILE_ACTION_MODIFIED:
                    wprintf(L"MODIFIED: %s\n", path.c_str());
                    break;
                case FILE_ACTION_RENAMED_OLD_NAME:
                    wprintf(L"RENAMED_FROM: %s\n", path.c_str());
                    break;
                case FILE_ACTION_RENAMED_NEW_NAME:
                    wprintf(L"RENAMED_TO: %s\n", path.c_str());
                    break;
            }

            if (fni->NextEntryOffset == 0) break;

            fni = (FILE_NOTIFY_INFORMATION*)((BYTE*)fni + fni->NextEntryOffset);
        }
    }
}

napi_value watch_path_wrapper(napi_env env, napi_callback_info info)
{
    auto [rootPath, rootUuid] = napi_extract_args<std::wstring, std::wstring>(env, info);

    return run_async(env, "WatchPathAsync", watch_path, std::move(rootPath), std::move(rootUuid));
}
