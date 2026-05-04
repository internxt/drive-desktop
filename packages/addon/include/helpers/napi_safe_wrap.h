#pragma once

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

using NapiInnerFn = napi_value (*)(napi_env, napi_callback_info, void*, const char*);

static napi_value seh_guard(napi_env env, napi_callback_info info, NapiInnerFn inner, void* ctx, const char* function_name)
{
    __try {
        return inner(env, info, ctx, function_name);
    } __except (EXCEPTION_EXECUTE_HANDLER) {
        napi_throw_error(env, nullptr, "SEH exception (access violation or similar)");
        return nullptr;
    }
}

template <typename Fn>
napi_value napi_safe_wrap(napi_env env, napi_callback_info info, Fn&& fn, const char* function_name)
{
    return seh_guard(env, info, [](napi_env env, napi_callback_info info, void* ctx, const char* fn_name) -> napi_value {
            auto& f = *static_cast<std::decay_t<Fn>*>(ctx);
            try {
                return f(env, info);
            } catch (...) {
                std::string error_msg = format_exception_message(fn_name);
                napi_throw_error(env, nullptr, error_msg.c_str());
                return nullptr;
            } }, &fn, function_name);
}

#define NAPI_SAFE_WRAP(env, info, fn) \
    napi_safe_wrap(env, info, fn, __FUNCTION__)
