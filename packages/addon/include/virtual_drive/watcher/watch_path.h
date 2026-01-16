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

    napi_set_named_property(env, eventObj, "event", type);
    napi_set_named_property(env, eventObj, "path", path);
    napi_set_named_property(env, eventObj, "parentUuid", parentUuid);

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, 1, &eventObj, nullptr);

    delete event;
}

inline void sendEvent(WatcherContext* ctx, const std::string& type, const std::string& path)
{
    auto event = new WatcherEvent{type, path};
    napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
}

inline std::string wstringToUtf8(const std::wstring& wstr)
{
    if (wstr.empty()) return {};

    int size = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), nullptr, 0, nullptr, nullptr);
    std::string result(size, 0);
    WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), result.data(), size, nullptr, nullptr);
    return result;
}

inline void processEvent(FILE_NOTIFY_INFORMATION* fni, const std::wstring& rootPath, WatcherContext* ctx)
{
    std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
    std::wstring path = rootPath + L"\\" + filename;
    std::string pathStr = wstringToUtf8(path);

    if (fni->Action == FILE_ACTION_MODIFIED) {
        sendEvent(ctx, "update", pathStr);
    } else if (fni->Action == FILE_ACTION_REMOVED || fni->Action == FILE_ACTION_RENAMED_OLD_NAME) {
        sendEvent(ctx, "delete", pathStr);
    } else if (fni->Action == FILE_ACTION_ADDED || fni->Action == FILE_ACTION_RENAMED_NEW_NAME) {
        sendEvent(ctx, "create", pathStr);
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

            if (!success) {
                sendEvent(ctx, "error", std::format("ReadDirectoryChangesW failed: {}", GetLastError()));
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
            sendEvent(ctx, "error", format_exception_message("WatchPath"));
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
                sendEvent(ctx, "error", format_exception_message("WatchPathWrapper"));
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
