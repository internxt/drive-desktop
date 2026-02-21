#pragma once

#include <external.h>
#include <node_api.h>

template <typename T>
struct NapiSerializer {
    static napi_value serialize(napi_env env, const T& value);
};

inline std::string wstringToUtf8(const std::wstring& wstr)
{
    if (wstr.empty()) return {};

    int size = WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), nullptr, 0, nullptr, nullptr);
    std::string result(size, 0);
    WideCharToMultiByte(CP_UTF8, 0, wstr.c_str(), (int)wstr.size(), result.data(), size, nullptr, nullptr);
    return result;
}

inline void napiSetString(napi_env env, napi_value obj, const char* key, const std::string& value)
{
    napi_value val;
    napi_create_string_utf8(env, value.c_str(), NAPI_AUTO_LENGTH, &val);
    napi_set_named_property(env, obj, key, val);
}

inline void napiSetWstring(napi_env env, napi_value obj, const char* key, const std::wstring& value)
{
    napiSetString(env, obj, key, wstringToUtf8(value));
}

inline void napiSetUint32(napi_env env, napi_value obj, const char* key, uint32_t value)
{
    napi_value val;
    napi_create_uint32(env, value, &val);
    napi_set_named_property(env, obj, key, val);
}

inline void napiSetInt64(napi_env env, napi_value obj, const char* key, LONGLONG value)
{
    napi_value val;
    napi_create_int64(env, value, &val);
    napi_set_named_property(env, obj, key, val);
}

inline void napiSetBool(napi_env env, napi_value obj, const char* key, bool value)
{
    napi_value val;
    napi_get_boolean(env, value, &val);
    napi_set_named_property(env, obj, key, val);
}
