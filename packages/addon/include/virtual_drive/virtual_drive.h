#pragma once

#include <node_api.h>

napi_value connect_sync_root_impl(napi_env env, napi_callback_info args);
napi_value convert_to_placeholder_wrapper(napi_env env, napi_callback_info args);
napi_value create_file_placeholder_wrapper(napi_env env, napi_callback_info args);
napi_value create_folder_placeholder_wrapper(napi_env env, napi_callback_info args);
napi_value dehydrate_file_wrapper(napi_env env, napi_callback_info info);
napi_value disconnect_sync_root_wrapper(napi_env env, napi_callback_info args);
napi_value get_placeholder_state_wrapper(napi_env env, napi_callback_info info);
napi_value get_registered_sync_roots_wrapper(napi_env env, napi_callback_info args);
napi_value hydrate_file_wrapper(napi_env env, napi_callback_info args);
napi_value register_sync_root_wrapper(napi_env env, napi_callback_info args);
napi_value set_pin_state_wrapper(napi_env env, napi_callback_info info);
napi_value unregister_sync_root_wrapper(napi_env env, napi_callback_info args);
napi_value update_placeholder_wrapper(napi_env env, napi_callback_info info);
napi_value update_sync_status_wrapper(napi_env info, napi_callback_info args);
void convert_to_placeholder(const std::wstring& path, const std::wstring& placeholderId);
