#pragma once

#include <node_api.h>

napi_value convert_to_placeholder_wrapper(napi_env env, napi_callback_info args);
void convert_to_placeholder(const std::wstring &path, const std::wstring &placeholderId);
