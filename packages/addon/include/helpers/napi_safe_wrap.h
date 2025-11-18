#ifndef NAPI_SAFE_WRAP_H
#define NAPI_SAFE_WRAP_H

#include <node_api.h>
#include <exception>
#include <string>

template <typename Fn>
napi_value napi_safe_wrap(napi_env env, napi_callback_info info, Fn &&fn, const char *function_name)
{
    std::ostringstream oss;

    try
    {
        return fn(env, info);
    }
    catch (const winrt::hresult_error &e)
    {
        oss << "[" << function_name << "] WinRT error: " << winrt::to_string(e.message()) << " (HRESULT: 0x" << std::hex << e.code() << ")";
    }
    catch (const std::exception &e)
    {
        oss << "[" << function_name << "] " << e.what();
    }
    catch (...)
    {
        oss << "[" << function_name << "] Unknown native error";
    }

    napi_throw_error(env, nullptr, oss.str().c_str());
    return nullptr;
}

#define NAPI_SAFE_WRAP(env, info, fn) \
    napi_safe_wrap(env, info, fn, __FUNCTION__)

#endif
