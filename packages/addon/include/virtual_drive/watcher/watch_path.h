#pragma once

inline void callWatcherJsCallback(napi_env env, napi_value jsCallback, void* context, void* data)
{
    WatcherEvent* event = static_cast<WatcherEvent*>(data);

    napi_value obj;
    napi_create_object(env, &obj);

    napiSetString(env, obj, "action", event->action);
    napiSetString(env, obj, "type", event->type);
    napiSetWstring(env, obj, "path", event->path);
    napiSetInt64(env, obj, "internalId", (LONGLONG)event->internalId);
    napiSetInt64(env, obj, "size", (LONGLONG)event->size);
    napiSetDouble(env, obj, "ctimeMs", event->ctimeMs);
    napiSetDouble(env, obj, "mtimeMs", event->mtimeMs);

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, 1, &obj, nullptr);

    delete event;
}

// Converts a Windows FILETIME (100-ns intervals since 1601-01-01) to Unix milliseconds
inline double fileTimeToUnixMs(const LARGE_INTEGER& li)
{
    // 116444736000000000 = number of 100-ns intervals between 1601 and 1970
    return (double)((li.QuadPart - 116444736000000000LL) / 10000LL);
}

inline void sendEvent(WatcherContext* ctx, const std::string& action, const std::wstring& path, FILE_NOTIFY_EXTENDED_INFORMATION* fni)
{
    std::string type = (fni->FileAttributes & FILE_ATTRIBUTE_DIRECTORY) ? "folder" : "file";

    auto event = new WatcherEvent{
        action,
        path,
        type,
        (uint64_t)fni->FileId.QuadPart,
        (uint64_t)fni->FileSize.QuadPart,
        fileTimeToUnixMs(fni->LastChangeTime),
        fileTimeToUnixMs(fni->LastModificationTime),
    };

    napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
}

inline void sendError(WatcherContext* ctx, const std::string& error)
{
    std::wstring wError(error.begin(), error.end());
    auto event = new WatcherEvent{"error", wError, "error"};
    napi_call_threadsafe_function(ctx->tsfn, event, napi_tsfn_blocking);
}

inline void processEvent(FILE_NOTIFY_EXTENDED_INFORMATION* fni, const std::wstring& rootPath, WatcherContext* ctx)
{
    std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
    std::wstring path = rootPath + L"/" + filename;
    std::replace(path.begin(), path.end(), L'\\', L'/');

    switch (fni->Action) {
        case FILE_ACTION_ADDED:
            sendEvent(ctx, "create", path, fni);
            break;
        case FILE_ACTION_REMOVED:
            sendEvent(ctx, "delete", path, fni);
            break;
        case FILE_ACTION_MODIFIED:
            sendEvent(ctx, "update", path, fni);
            break;
        case FILE_ACTION_RENAMED_OLD_NAME:
            sendEvent(ctx, "rename_old", path, fni);
            break;
        case FILE_ACTION_RENAMED_NEW_NAME:
            sendEvent(ctx, "rename_new", path, fni);
            break;
    }
}

inline void watchPath(WatcherContext* ctx, const std::wstring& rootPath)
{
    auto hDirectory = openFileHandle(rootPath.c_str(), FILE_LIST_DIRECTORY, false);

    BYTE buffer[64 * 1024];

    while (!ctx->shouldStop) {
        try {
            DWORD bytesReturned = 0;

            BOOL success = ReadDirectoryChangesExW(
                hDirectory.get(),
                buffer,
                sizeof(buffer),
                TRUE,
                FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_DIR_NAME | FILE_NOTIFY_CHANGE_SIZE | FILE_NOTIFY_CHANGE_ATTRIBUTES,
                &bytesReturned,
                nullptr,
                nullptr,
                ReadDirectoryNotifyExtendedInformation);

            if (!success) {
                sendError(ctx, std::format("ReadDirectoryChangesExW failed: {}", GetLastError()));
                break;
            }

            if (ctx->shouldStop) break;

            FILE_NOTIFY_EXTENDED_INFORMATION* fni = (FILE_NOTIFY_EXTENDED_INFORMATION*)buffer;

            while (true) {
                processEvent(fni, rootPath, ctx);

                if (fni->NextEntryOffset == 0) break;

                fni = (FILE_NOTIFY_EXTENDED_INFORMATION*)((BYTE*)fni + fni->NextEntryOffset);
            }
        } catch (...) {
            sendError(ctx, format_exception_message("WatchPath"));
        }
    }
}

inline napi_value watchPathWrapper(napi_env env, napi_callback_info info)
{
    auto [rootPath, onEventCallback] = napi_extract_args<std::wstring, napi_value>(env, info);

    auto tsfn = registerThreadsafeCallback("WatchPathCallback", env, onEventCallback, callWatcherJsCallback);

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

inline napi_value WatchPathWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, watchPathWrapper);
}
