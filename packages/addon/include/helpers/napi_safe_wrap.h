#ifndef NAPI_SAFE_WRAP_H
#define NAPI_SAFE_WRAP_H

#include <node_api.h>
#include <stdafx.h>

#include <exception>
#include <string>

inline std::string format_exception_message(const char* function_name)
{
    try {
        throw;
    } catch (const winrt::hresult_error& e) {
        return std::format("[{}] WinRT error: {} (HRESULT: 0x{:x})", function_name, winrt::to_string(e.message()), static_cast<uint32_t>(e.code()));
    } catch (const std::exception& e) {
        return std::format("[{}] {}", function_name, e.what());
    } catch (...) {
        return std::format("[{}] Unknown native error", function_name);
    }
}

template <typename Fn>
napi_value napi_safe_wrap(napi_env env, napi_callback_info info, Fn&& fn, const char* function_name)
{
    try {
        return fn(env, info);
    } catch (...) {
        std::string error_msg = format_exception_message(function_name);
        napi_throw_error(env, nullptr, error_msg.c_str());
        return nullptr;
    }
}

#define NAPI_SAFE_WRAP(env, info, fn) \
    napi_safe_wrap(env, info, fn, __FUNCTION__)

#endif
