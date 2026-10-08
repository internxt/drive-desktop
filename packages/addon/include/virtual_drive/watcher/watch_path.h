#pragma once

/**
 * Windows watcher -> JavaScript bridge.
 *
 * `watchPath` runs on a dedicated native thread and waits for Windows change notifications.
 * It must never invoke JavaScript directly from that thread.
 * Instead it sends batches through N-API thread-safe function (TSFN).
 * N-API later invokes `callJsCallback` on Electron main thread.
 *
 * The batch is an important boundary: one filesystem event must still become one WatcherEvent,
 * but a large copy must not create one N-API callback for every item.
 * JavaScript does debounce/coalescing and bounded Sync work after receiving each batch.
 */

/** Converts one native WatcherEvent to the object expected by TypeScript. */
inline napi_value watcherEventToJs(napi_env env, const WatcherEvent& event)
{
    napi_value obj;
    napi_create_object(env, &obj);
    napiSetString(env, obj, "action", event.action);
    napiSetString(env, obj, "type", event.type);
    napiSetWstring(env, obj, "path", event.path);
    napiSetInt64(env, obj, "internalId", static_cast<LONGLONG>(event.internalId));
    napiSetInt64(env, obj, "size", static_cast<LONGLONG>(event.size));
    napiSetDouble(env, obj, "ctimeMs", event.ctimeMs);
    napiSetDouble(env, obj, "mtimeMs", event.mtimeMs);
    napiSetDouble(env, obj, "observedAtMs", event.observedAtMs);
    return obj;
}

/**
 * Runs on the JavaScript thread, not on the native watcher thread.
 *
 * `data` was allocated in sendBatch. unique_ptr takes ownership immediately,
 * so the native vector is released whether JavaScript accepts the callback or
 * an exception occurs while building the JS array.
 */
inline void callJsCallback(napi_env env, napi_value jsCallback, void* context, void* data)
{
    std::unique_ptr<WatcherEventBatch> batch(static_cast<WatcherEventBatch*>(data));
    napi_value events;
    napi_create_array_with_length(env, batch->events.size(), &events);
    for (size_t index = 0; index < batch->events.size(); ++index) {
        napi_set_element(env, events, index, watcherEventToJs(env, batch->events[index]));
    }

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, 1, &events, nullptr);
}

/** Converts a Windows FILETIME (100 ns since 1601-01-01) to Unix milliseconds. */
inline double fileTimeToUnixMs(const LARGE_INTEGER& li)
{
    // 116444736000000000 is the number of 100 ns intervals between 1601 and 1970.
    return static_cast<double>((li.QuadPart - 116444736000000000LL) / 10000LL);
}

/**
 * Captures when the native watcher receives a completed Windows notification.
 * Electron may process the queued N-API callback much later during a large
 * copy, but that delay must not make a recent filesystem timestamp look old.
 */
inline double nowUnixMs()
{
    FILETIME fileTime;
    GetSystemTimeAsFileTime(&fileTime);
    LARGE_INTEGER value;
    value.LowPart = fileTime.dwLowDateTime;
    value.HighPart = fileTime.dwHighDateTime;
    return fileTimeToUnixMs(value);
}

/** Builds our platform-independent event payload from Windows metadata. */
inline WatcherEvent toWatcherEvent(const std::string& action, const std::wstring& path, FILE_NOTIFY_EXTENDED_INFORMATION* fni, double observedAtMs)
{
    return {action, path, (fni->FileAttributes & FILE_ATTRIBUTE_DIRECTORY) ? "folder" : "file", static_cast<uint64_t>(fni->FileId.QuadPart),
        static_cast<uint64_t>(fni->FileSize.QuadPart), fileTimeToUnixMs(fni->LastChangeTime), fileTimeToUnixMs(fni->LastModificationTime), observedAtMs};
}

/**
 * Transfers one non-empty batch from the watcher thread to JavaScript.
 *
 * The TSFN currently has an unlimited internal queue.
 * Therefore napi_tsfn_blocking does not block this native thread.
 * It simply queues a callback for Electron.
 * Batching is the safe first form of backpressure: it reduces the number of callbacks without dropping any filesystem events.
 *
 * Do not configure a bounded TSFN queue until the overflow path performs a
 * tested filesystem reconciliation. Rejecting a native batch without such a
 * recovery path would silently lose Sync changes.
 */
inline void sendBatch(WatcherContext* ctx, std::vector<WatcherEvent>&& events)
{
    if (events.empty()) return;
    auto* batch = new WatcherEventBatch{std::move(events)};
    const auto status = napi_call_threadsafe_function(ctx->tsfn, batch, napi_tsfn_blocking);
    if (status != napi_ok) {
        // N-API does not take ownership when it rejects the call
        // (for example, while the watcher is closing), so the native batch remains ours.
        delete batch;
    }
}

/**
 * Adds one Windows record to the currently assembled batch.
 *
 * Windows reports paths relative to rootPath. We make the path absolute and
 * normalize separators because TypeScript expects forward-slash paths.
 * `FILE_ACTION_RENAMED_OLD_NAME` is deliberately not emitted here: existing
 * Sync semantics use the event for the new name.
 */
inline void processEvent(FILE_NOTIFY_EXTENDED_INFORMATION* fni, const std::wstring& rootPath, double observedAtMs, std::vector<WatcherEvent>& events)
{
    std::wstring filename(fni->FileName, fni->FileNameLength / sizeof(WCHAR));
    std::wstring path = rootPath + L"/" + filename;
    std::replace(path.begin(), path.end(), L'\\', L'/');
    switch (fni->Action) {
        case FILE_ACTION_ADDED: events.push_back(toWatcherEvent("create", path, fni, observedAtMs)); break;
        case FILE_ACTION_REMOVED: events.push_back(toWatcherEvent("delete", path, fni, observedAtMs)); break;
        case FILE_ACTION_MODIFIED: events.push_back(toWatcherEvent("update", path, fni, observedAtMs)); break;
        case FILE_ACTION_RENAMED_NEW_NAME: events.push_back(toWatcherEvent("rename_new", path, fni, observedAtMs)); break;
    }
}

/** Sends watcher failures through the same JS callback shape as normal events. */
inline void sendError(WatcherContext* ctx, const std::string& error)
{
    sendBatch(ctx, {{"error", std::wstring(error.begin(), error.end())}});
}

/**
 * Blocking loop for one watched Sync root, running on its own native thread.
 *
 * ReadDirectoryChangesExW waits until Windows has at least one change to
 * report. Its 64 KiB buffer is owned by this thread and only contains the
 * notifications returned by this one read; it is not a global queue of all
 * changes in the copy operation.
 */
inline void watchPath(WatcherContext* ctx, const std::wstring& rootPath)
{
    auto hDirectory = openFileHandle(rootPath.c_str(), FILE_LIST_DIRECTORY, false);
    BYTE buffer[64 * 1024];
    while (!ctx->shouldStop) {
        try {
            DWORD bytesReturned = 0;
            const BOOL success = ReadDirectoryChangesExW(hDirectory.get(), buffer, sizeof(buffer), TRUE,
                FILE_NOTIFY_CHANGE_FILE_NAME | FILE_NOTIFY_CHANGE_DIR_NAME | FILE_NOTIFY_CHANGE_SIZE | FILE_NOTIFY_CHANGE_ATTRIBUTES,
                &bytesReturned, nullptr, nullptr, ReadDirectoryNotifyExtendedInformation);
            if (!success) { sendError(ctx, std::format("ReadDirectoryChangesExW failed: {}", GetLastError())); break; }
            if (ctx->shouldStop) break;
            // bytesReturned == 0 is Windows overflow signal: it has lost the precise sequence of notifications.
            // The only correct recovery is reconciliation: scan the actual root and compare it with remote known state
            // then enqueue the discovered differences.
            if (bytesReturned == 0) { sendError(ctx, "ReadDirectoryChangesExW buffer overflow; reconciliation required"); continue; }

            const auto observedAtMs = nowUnixMs();

            std::vector<WatcherEvent> events;
            events.reserve(WATCHER_NATIVE_BATCH_SIZE);
            // The records are packed consecutively in `buffer`.
            // NextEntryOffset is the byte distance from this record to the next one.
            auto* fni = reinterpret_cast<FILE_NOTIFY_EXTENDED_INFORMATION*>(buffer);
            while (true) {
                processEvent(fni, rootPath, observedAtMs, events);
                // Send full batches immediately. std::move transfers the vector
                // to N-API. Reset it explicitly rather than relying on the
                // unspecified state of a moved-from vector.
                if (events.size() == WATCHER_NATIVE_BATCH_SIZE) {
                    sendBatch(ctx, std::move(events));
                    events.clear();
                    events.reserve(WATCHER_NATIVE_BATCH_SIZE);
                }
                if (fni->NextEntryOffset == 0) break;
                fni = reinterpret_cast<FILE_NOTIFY_EXTENDED_INFORMATION*>(reinterpret_cast<BYTE*>(fni) + fni->NextEntryOffset);
            }
            sendBatch(ctx, std::move(events));
        } catch (...) { sendError(ctx, format_exception_message("WatchPath")); }
    }
}

/**
 * N-API entry point.
 * It creates the TSFN and starts the blocking watcher work outside Electron main thread.
 * The returned external pointer is later used by unwatchPath to set `shouldStop`.
 */
inline napi_value watchPathWrapper(napi_env env, napi_callback_info info)
{
    auto [rootPath, onEvents] = napi_extract_args<std::wstring, napi_value>(env, info);
    auto tsfn = registerThreadsafeCallback("WatchPathBatch", env, onEvents, callJsCallback);
    auto ctx = new WatcherContext{tsfn};
    std::thread([ctx, rootPath = std::move(rootPath)]() {
        // Do not allow an exception to escape a detached std::thread: that
        // would terminate the process. Normal watcher errors are forwarded to
        // JavaScript from inside watchPath.
        try { watchPath(ctx, rootPath); }
        catch (...) { printf("Error in watch path thread: %s\n", format_exception_message("WatchPathThread").c_str()); }
        // No more batches will be submitted after watchPath returns. Release
        // the N-API resource and then free the context owned by this thread.
        napi_release_threadsafe_function(ctx->tsfn, napi_tsfn_release);
        delete ctx;
    }).detach();
    napi_value external;
    napi_create_external(env, ctx, nullptr, nullptr, &external);
    return external;
}

inline napi_value WatchPathWrapper(napi_env env, napi_callback_info args) { return NAPI_SAFE_WRAP(env, args, watchPathWrapper); }
