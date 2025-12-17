#pragma once

#include <node_api.h>

napi_value set_pin_state_wrapper(napi_env env, napi_callback_info info);
napi_value update_placeholder_wrapper(napi_env env, napi_callback_info info);
napi_value revert_placeholder_wrapper(napi_env env, napi_callback_info info);
