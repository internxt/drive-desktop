#pragma once

#include <Placeholders.h>

inline void callJsCallback(napi_env env, napi_value jsCallback, void* context, void* data)
{
    WatcherEvent* event = static_cast<WatcherEvent*>(data);

    napi_value obj;
    napi_create_object(env, &obj);

    napiSetString(env, obj, "action", event->action);
    napiSetString(env, obj, "type", event->type);
    napiSetString(env, obj, "path", event->path);

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, 1, &obj, nullptr);

    delete event;
}

inline void sendEvent(WatcherContext* ctx, const std::string& action, const std::wstring& path)
{
    std::string type;
    std::string pathStr = wstringToUtf8(path);

    if (action == "delete") {
        type = "unknown";
    } else {
        DWORD attrs = GetFileAttributesW(path.c_str());
        if (attrs == INVALID_FILE_ATTRIBUTES) {
            type = "error";
        } else {
            type = (attrs & FILE_ATTRIBUTE_DIRECTORY) ? "folder" : "file";
        }
    }

    auto event = new WatcherEvent{action, pathStr, type};
    napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
}

inline void sendError(WatcherContext* ctx, const std::string& error)
{
    auto event = new WatcherEvent{"error", error, "error"};
    napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
}

inline void processEvent(FILE_NOTIFY_INFORMATION* fni, const std::wstring& rootPath, WatcherContext* ctx)
{
    std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
    std::wstring path = rootPath + L"\\" + filename;

    if (fni->Action == FILE_ACTION_MODIFIED) {
        sendEvent(ctx, "update", path);
    } else if (fni->Action == FILE_ACTION_REMOVED || fni->Action == FILE_ACTION_RENAMED_OLD_NAME) {
        sendEvent(ctx, "delete", path);
    } else if (fni->Action == FILE_ACTION_ADDED || fni->Action == FILE_ACTION_RENAMED_NEW_NAME) {
        sendEvent(ctx, "create", path);
    }
}

inline void watchPath(WatcherContext* ctx, const std::wstring& rootPath)
{
    auto hDirectory = Placeholders::OpenFileHandle(rootPath.c_str(), FILE_LIST_DIRECTORY, false);

    BYTE buffer[64 * 1024];

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

            if (!success) {
                sendError(ctx, std::format("ReadDirectoryChangesW failed: {}", GetLastError()));
                break;
            }

            if (ctx->shouldStop) break;

            FILE_NOTIFY_INFORMATION* fni = (FILE_NOTIFY_INFORMATION*)buffer;

            while (true) {
                processEvent(fni, rootPath, ctx);

                if (fni->NextEntryOffset == 0) break;

                fni = (FILE_NOTIFY_INFORMATION*)((BYTE*)fni + fni->NextEntryOffset);
            }
        } catch (...) {
            sendError(ctx, format_exception_message("WatchPath"));
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
            try {
                watchPath(ctx, rootPath);
            } catch (...) {
                sendError(ctx, format_exception_message("WatchPathWrapper"));
            }

            wprintf(L"Remove watcher context\n");

            napi_release_threadsafe_function(ctx->tsfn, napi_tsfn_release);
            delete ctx;
        } catch (...) {
            auto error = format_exception_message("WatchPathThread");
            wprintf(L"Error in watch path thread: %s\n", error.c_str());
        }
    }).detach();

    napi_value external;
    napi_create_external(env, ctx, nullptr, nullptr, &external);
    return external;
}
