#pragma once

#include <external.h>

napi_threadsafe_function registerThreadsafeCallback(const std::string& resourceName, napi_env env, napi_value callback, napi_threadsafe_function_call_js callJsCallback)
{
    std::u16string convertedResourceName(resourceName.begin(), resourceName.end());

    napi_value resourceNameValue;
    napi_create_string_utf16(env, convertedResourceName.c_str(), NAPI_AUTO_LENGTH, &resourceNameValue);

    napi_threadsafe_function tsfn;
    napi_create_threadsafe_function(
        env,
        callback,
        nullptr,
        resourceNameValue,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        callJsCallback,
        &tsfn);

    return tsfn;
}
