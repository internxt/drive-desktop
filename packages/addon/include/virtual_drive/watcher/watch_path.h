#pragma once

#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>
#include <stdio.h>

#include <filesystem>
#include <vector>

inline void call_js_callback(napi_env env, napi_value js_callback, void* context, void* data)
{
    WatcherEvent* event = static_cast<WatcherEvent*>(data);

    napi_value argv[3];

    napi_create_string_utf8(env, event->action.c_str(), NAPI_AUTO_LENGTH, &argv[0]);
    napi_create_string_utf8(env, event->path.c_str(), NAPI_AUTO_LENGTH, &argv[1]);
    napi_create_string_utf8(env, event->parentUuid.c_str(), NAPI_AUTO_LENGTH, &argv[2]);

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, js_callback, 3, argv, nullptr);

    delete event;
}

inline std::optional<std::string> get_parent_uuid(const std::wstring& path, const std::wstring& rootPath, const std::string rootUuid)
{
    std::wstring parentPath = std::filesystem::path(path).parent_path().wstring();

    if (parentPath == rootPath) {
        return rootUuid;
    }

    try {
        return Placeholders::GetPlaceholderInfo(parentPath).uuid;
    } catch (...) {
        return std::nullopt;
    }
}

inline void watch_path(WatcherContext* ctx, const std::wstring& rootPath, const std::wstring& rootUuid)
{
    auto hDirectory = Placeholders::OpenFileHandle(rootPath.c_str(), FILE_LIST_DIRECTORY, false);

    BYTE buffer[64 * 1024];
    std::string rootUuidStr(rootUuid.begin(), rootUuid.end());

    while (!ctx->shouldStop) {
        wprintf(L"Read directory\n");

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

        if (!success || ctx->shouldStop) break;

        FILE_NOTIFY_INFORMATION* fni = (FILE_NOTIFY_INFORMATION*)buffer;

        while (true) {
            std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
            std::wstring wpath = rootPath + L"\\" + filename;
            std::string path(wpath.begin(), wpath.end());

            if (fni->Action == FILE_ACTION_MODIFIED) {
                auto event = new WatcherEvent{"update", path, ""};
                napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
            } else {
                auto parentUuid = get_parent_uuid(wpath, rootPath, rootUuidStr);

                if (parentUuid) {
                    if (fni->Action == FILE_ACTION_ADDED || fni->Action == FILE_ACTION_RENAMED_NEW_NAME) {
                        auto event = new WatcherEvent{"create", path, *parentUuid};
                        napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);

                    } else if (fni->Action == FILE_ACTION_REMOVED || fni->Action == FILE_ACTION_RENAMED_OLD_NAME) {
                        auto event = new WatcherEvent{"delete", path, *parentUuid};
                        napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
                    }
                }
            }

            if (fni->NextEntryOffset == 0) break;

            fni = (FILE_NOTIFY_INFORMATION*)((BYTE*)fni + fni->NextEntryOffset);
        }
    }

    napi_release_threadsafe_function(ctx->tsfn, napi_tsfn_release);

    delete ctx;
}

inline napi_value watch_path_wrapper(napi_env env, napi_callback_info info)
{
    auto [rootPath, rootUuid, onEventCallback] = napi_extract_args<std::wstring, std::wstring, napi_value>(env, info);

    auto tsfn = register_threadsafe_callback("WatchPathCallback", env, onEventCallback, call_js_callback);

    auto ctx = new WatcherContext{tsfn, false};

    std::thread([ctx, rootPath = std::move(rootPath), rootUuid = std::move(rootUuid)]() {
        watch_path(ctx, rootPath, rootUuid);
    }).detach();

    napi_value external;
    napi_create_external(env, ctx, nullptr, nullptr, &external);
    return external;
}
