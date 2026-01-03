#pragma once

inline napi_value unwatchPathWrapper(napi_env env, napi_callback_info info)
{
    auto [handle] = napi_extract_args<napi_value>(env, info);

    WatcherContext* ctx;
    napi_get_value_external(env, handle, reinterpret_cast<void**>(&ctx));

    if (ctx) {
        wprintf(L"Stop watcher\n");
        ctx->shouldStop = true;
    }

    return nullptr;
}
