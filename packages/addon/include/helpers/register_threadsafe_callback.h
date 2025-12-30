#pragma once

#include <node_api.h>

#include <string>

napi_threadsafe_function register_threadsafe_callback(const std::string& resource_name, napi_env env, napi_value callback, napi_threadsafe_function_call_js call_js_cb)
{
    std::u16string converted_resource_name(resource_name.begin(), resource_name.end());

    napi_value resource_name_value;
    napi_create_string_utf16(env, converted_resource_name.c_str(), NAPI_AUTO_LENGTH, &resource_name_value);

    napi_threadsafe_function tsfn;
    napi_create_threadsafe_function(
        env,
        callback,
        nullptr,
        resource_name_value,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        call_js_cb,
        &tsfn);

    return tsfn;
}
