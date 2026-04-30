#pragma once

#include <internal.h>
#include <node_api.h>
#include <virtual_drive.h>

inline napi_value GetRegisteredSyncRootsWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_registered_sync_roots_wrapper);
}

inline napi_value GetPlaceholderStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_placeholder_state_wrapper);
}
