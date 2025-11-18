#pragma once

#include <node_api.h>
#include <string>
#include <tuple>

template <typename T>
T napi_extract_value(napi_env env, napi_value value);

template <>
inline std::wstring napi_extract_value<std::wstring>(napi_env env, napi_value value)
{
    size_t length;
    napi_get_value_string_utf16(env, value, nullptr, 0, &length);

    std::wstring result(length + 1, L'\0');
    size_t actualLength;
    napi_get_value_string_utf16(env, value, reinterpret_cast<char16_t *>(result.data()), length + 1, &actualLength);
    result.resize(actualLength);

    return result;
}

template <>
inline int64_t napi_extract_value<int64_t>(napi_env env, napi_value value)
{
    int64_t result;
    napi_get_value_int64(env, value, &result);
    return result;
}

template <>
inline bool napi_extract_value<bool>(napi_env env, napi_value value)
{
    bool result;
    napi_get_value_bool(env, value, &result);
    return result;
}

template <typename... Types, std::size_t... Is>
inline std::tuple<Types...> napi_extract_args_impl(napi_env env, napi_value *argv, std::index_sequence<Is...>)
{
    return std::make_tuple(napi_extract_value<Types>(env, argv[Is])...);
}

template <typename... Types>
inline std::tuple<Types...> napi_extract_args(napi_env env, napi_callback_info info)
{
    constexpr size_t N = sizeof...(Types);
    size_t argc = N;
    napi_value argv[N];
    napi_get_cb_info(env, info, &argc, argv, nullptr, nullptr);

    return napi_extract_args_impl<Types...>(env, argv, std::make_index_sequence<N>{});
}
