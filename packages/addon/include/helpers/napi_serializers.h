#pragma once

#include <node_api.h>

template <typename T>
struct NapiSerializer {
    static napi_value serialize(napi_env env, const T& value);
};
