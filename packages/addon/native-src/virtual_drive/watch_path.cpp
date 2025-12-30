#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>
#include <stdio.h>
#include <windows.h>

#include <filesystem>
#include <vector>

struct WatchEvent {
    std::string eventType;
    std::wstring path;
    std::string parentUuid;
};

void CallJsCallback(napi_env env, napi_value js_callback, void* context, void* data)
{
    WatchEvent* event = static_cast<WatchEvent*>(data);

    napi_value argv[3];
    napi_value undefined;
    napi_get_undefined(env, &undefined);

    // First argument: event type
    napi_create_string_utf8(env, event->eventType.c_str(), NAPI_AUTO_LENGTH, &argv[0]);

    // Second argument: path
    std::string pathUtf8(event->path.begin(), event->path.end());
    napi_create_string_utf8(env, pathUtf8.c_str(), NAPI_AUTO_LENGTH, &argv[1]);

    // Third argument: parentUuid (or undefined for "update")
    if (event->eventType == "update") {
        argv[2] = undefined;
    } else {
        napi_create_string_utf8(env, event->parentUuid.c_str(), NAPI_AUTO_LENGTH, &argv[2]);
    }

    // Call the JavaScript callback
    napi_call_function(env, undefined, js_callback, 3, argv, nullptr);

    delete event;
}

std::optional<std::string> get_parent_uuid(const std::wstring& path, const std::wstring& rootPath, const std::string rootUuid)
{
    std::wstring parentPath = std::filesystem::path(path).parent_path().wstring();

    if (parentPath == rootPath) {
        return rootUuid;
    }

    try {
        auto fileState = Placeholders::GetPlaceholderInfo(parentPath);
        return fileState.uuid;
    } catch (...) {
        return std::nullopt;
    }
}

void watch_path(napi_threadsafe_function tsfn, const std::wstring& rootPath, const std::wstring& rootUuid)
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

            if (fni->Action == FILE_ACTION_MODIFIED) {
                wprintf(L"MODIFIED: %s\n", path.c_str());

                auto event = new WatchEvent{"update", path, ""};
                napi_call_threadsafe_function(tsfn, event, napi_tsfn_blocking);
            } else {
                auto parentUuid = get_parent_uuid(path, rootPath, rootUuidStr);

                if (parentUuid) {
                    if (fni->Action == FILE_ACTION_ADDED || fni->Action == FILE_ACTION_RENAMED_NEW_NAME) {
                        wprintf(L"ADDED: %s (parent placeholder: %S)\n", path.c_str(), parentUuid->c_str());

                        auto event = new WatchEvent{"create", path, *parentUuid};
                        napi_call_threadsafe_function(tsfn, event, napi_tsfn_blocking);

                    } else if (fni->Action == FILE_ACTION_REMOVED || fni->Action == FILE_ACTION_RENAMED_OLD_NAME) {
                        wprintf(L"REMOVED: %s (parent placeholder: %S)\n", path.c_str(), parentUuid->c_str());

                        auto event = new WatchEvent{"delete", path, *parentUuid};
                        napi_call_threadsafe_function(tsfn, event, napi_tsfn_blocking);
                    }
                }
            }

            if (fni->NextEntryOffset == 0) break;

            fni = (FILE_NOTIFY_INFORMATION*)((BYTE*)fni + fni->NextEntryOffset);
        }
    }

    napi_release_threadsafe_function(tsfn, napi_tsfn_release);
}

napi_value watch_path_wrapper(napi_env env, napi_callback_info info)
{
    auto [rootPath, rootUuid, onEvent] = napi_extract_args<std::wstring, std::wstring, napi_value>(env, info);

    napi_value async_resource_name;
    napi_create_string_utf8(env, "WatchPathCallback", NAPI_AUTO_LENGTH, &async_resource_name);

    napi_threadsafe_function tsfn;
    napi_create_threadsafe_function(
        env,
        onEvent,
        nullptr,
        async_resource_name,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        CallJsCallback,
        &tsfn);

    std::thread([tsfn, rootPath = std::move(rootPath), rootUuid = std::move(rootUuid)]() {
        watch_path(tsfn, rootPath, rootUuid);
    }).detach();

    return nullptr;
}