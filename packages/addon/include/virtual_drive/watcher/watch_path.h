#pragma once

#include <Placeholders.h>

inline void callJsCallback(napi_env env, napi_value jsCallback, void* context, void* data)
{
    WatcherEvent* event = static_cast<WatcherEvent*>(data);

    napi_value eventObj;
    napi_create_object(env, &eventObj);

    napi_value type, path, parentUuid;
    napi_create_string_utf8(env, event->type.c_str(), NAPI_AUTO_LENGTH, &type);
    napi_create_string_utf8(env, event->path.c_str(), NAPI_AUTO_LENGTH, &path);

    napi_set_named_property(env, eventObj, "type", type);
    napi_set_named_property(env, eventObj, "path", path);
    napi_set_named_property(env, eventObj, "parentUuid", parentUuid);

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, 1, &eventObj, nullptr);

    delete event;
}

inline void processEvent(FILE_NOTIFY_INFORMATION* fni, const std::wstring& rootPath, WatcherContext* ctx)
{
    std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
    std::wstring path = rootPath + L"\\" + filename;
    std::string pathStr(path.begin(), path.end());

    if (fni->Action == FILE_ACTION_MODIFIED) {
        auto event = new WatcherEvent{"update", pathStr};
        napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
    } else if (fni->Action == FILE_ACTION_REMOVED || fni->Action == FILE_ACTION_RENAMED_OLD_NAME) {
        auto event = new WatcherEvent{"delete", pathStr};
        napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
    } else {
        auto event = new WatcherEvent{"create", pathStr};
        napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
    }
}

inline void watchPath(WatcherContext* ctx, const std::wstring& rootPath)
{
    auto hDirectory = Placeholders::OpenFileHandle(rootPath.c_str(), FILE_LIST_DIRECTORY, false);

    BYTE buffer[4 * 1024];

    while (!ctx->shouldStop) {
        try {
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
                processEvent(fni, rootPath, ctx);

                if (fni->NextEntryOffset == 0) break;

                fni = (FILE_NOTIFY_INFORMATION*)((BYTE*)fni + fni->NextEntryOffset);
            }
        } catch (...) {
            auto event = new WatcherEvent{"error", format_exception_message("WatchPath")};
            napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
        }
    }
}

inline napi_value watchPathWrapper(napi_env env, napi_callback_info info)
{
    auto [rootPath, onEventCallback] = napi_extract_args<std::wstring, napi_value>(env, info);

    auto tsfn = registerThreadsafeCallback("WatchPathCallback", env, onEventCallback, callJsCallback);

    auto ctx = new WatcherContext{tsfn, false};

    std::thread([ctx, rootPath = std::move(rootPath)]() {
        try {
            watchPath(ctx, rootPath);
        } catch (...) {
            auto event = new WatcherEvent{"error", format_exception_message("WatchPathWrapper")};
            napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
        }

        wprintf(L"Remove watcher context\n");

        napi_release_threadsafe_function(ctx->tsfn, napi_tsfn_release);
        delete ctx;
    }).detach();

    napi_value external;
    napi_create_external(env, ctx, nullptr, nullptr, &external);
    return external;
}
