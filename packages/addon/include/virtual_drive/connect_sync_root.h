#pragma once

#include <node_api.h>

napi_value connect_sync_root_impl(napi_env env, napi_callback_info args);
napi_value set_pin_state_wrapper(napi_env env, napi_callback_info info);
napi_value update_placeholder_wrapper(napi_env env, napi_callback_info info);
