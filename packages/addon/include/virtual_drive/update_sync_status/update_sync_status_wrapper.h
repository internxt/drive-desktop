#pragma once

#include <node_api.h>

void update_sync_status(const std::wstring& path);
napi_value update_sync_status_wrapper(napi_env info, napi_callback_info args);
