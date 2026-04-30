#pragma once

#include <internal.h>
#include <node_api.h>
#include <virtual_drive.h>

inline napi_value UnregisterSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, unregister_sync_root_wrapper);
}

inline napi_value RegisterSyncRootWrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, register_sync_root_wrapper);
}

inline napi_value GetRegisteredSyncRootsWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_registered_sync_roots_wrapper);
}

inline napi_value GetPlaceholderStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_placeholder_state_wrapper);
}

inline napi_value HydrateFileWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, hydrate_file_wrapper);
}

inline napi_value UnwatchPathWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, unwatchPathWrapper);
}

inline napi_value UpdatePlaceholderWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, update_placeholder_wrapper);
}

inline napi_value SetPinStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, set_pin_state_wrapper);
}

inline napi_value WatchPathWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, watchPathWrapper);
}
