#include <NAPI_SAFE_WRAP.h>
#include <connect_sync_root.h>
#include <convert_to_placeholder.h>
#include <create_file_placeholder.h>
#include <create_folder_placeholder.h>
#include <dehydrate_file.h>
#include <disconnect_sync_root.h>
#include <get_placeholder_state_wrapper.h>
#include <get_registered_sync_roots_wrapper.h>
#include <hydrate_file.h>
#include <register_sync_root.h>
#include <unregister_sync_root_wrapper.h>
#include <update_sync_status_wrapper.h>

napi_value CreateFilePlaceholderWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, create_file_placeholder_wrapper);
}

napi_value UnregisterSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, unregister_sync_root_wrapper);
}

napi_value RegisterSyncRootWrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, register_sync_root_wrapper);
}

napi_value GetRegisteredSyncRootsWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_registered_sync_roots_wrapper);
}

napi_value ConnectSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, connect_sync_root_impl);
}

napi_value CreateFolderPlaceholderWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, create_folder_placeholder_wrapper);
}

napi_value DisconnectSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, disconnect_sync_root_wrapper);
}

napi_value UpdateSyncStatusWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, update_sync_status_wrapper);
}

napi_value GetPlaceholderStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_placeholder_state_wrapper);
}

napi_value ConvertToPlaceholderWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, convert_to_placeholder_wrapper);
}

napi_value HydrateFileWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, hydrate_file_wrapper);
}

napi_value DehydrateFileWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, dehydrate_file_wrapper);
}

napi_value UpdatePlaceholderWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, update_placeholder_wrapper);
}

napi_value SetPinStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, set_pin_state_wrapper);
}
