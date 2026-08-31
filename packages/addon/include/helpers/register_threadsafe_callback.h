#pragma once

napi_threadsafe_function registerThreadsafeCallback(
    const std::string& resourceName,
    napi_env env,
    napi_value callback,
    napi_threadsafe_function_call_js callJsCallback,
    size_t maxQueueSize = 0) // maxQueueSize 0 means unlimited
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
        maxQueueSize,
        1,
        nullptr,
        nullptr,
        nullptr,
        callJsCallback,
        &tsfn);

    return tsfn;
}
