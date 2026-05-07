#pragma once

#include <optional>

template <typename T>
struct NapiSerializer {
    static napi_value serialize(napi_env env, const T& value);
};

template <>
struct NapiSerializer<std::wstring> {
    static napi_value serialize(napi_env env, const std::wstring& value)
    {
        napi_value result;
        napi_create_string_utf16(env, (char16_t*)value.c_str(), value.length(), &result);
        return result;
    }
};

template <>
struct NapiSerializer<std::optional<std::wstring>> {
    static napi_value serialize(napi_env env, const std::optional<std::wstring>& value)
    {
        if (value) return NapiSerializer<std::wstring>::serialize(env, *value);

        napi_value result;
        napi_get_undefined(env, &result);
        return result;
    }
};

template <>
struct NapiSerializer<std::vector<std::wstring>> {
    static napi_value serialize(napi_env env, const std::vector<std::wstring>& values)
    {
        napi_value result;
        napi_create_array_with_length(env, values.size(), &result);
        for (uint32_t i = 0; i < values.size(); i++) {
            napi_set_element(env, result, i, NapiSerializer<std::wstring>::serialize(env, values[i]));
        }
        return result;
    }
};

inline void napiSetString(napi_env env, napi_value obj, const char* key, const std::string& value)
{
    napi_value val;
    napi_create_string_utf8(env, value.c_str(), NAPI_AUTO_LENGTH, &val);
    napi_set_named_property(env, obj, key, val);
}

inline void napiSetWstring(napi_env env, napi_value obj, const char* key, const std::wstring& value)
{
    napi_value val;
    napi_create_string_utf16(env, (char16_t*)value.c_str(), value.length(), &val);
    napi_set_named_property(env, obj, key, val);
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

inline void napiSetDouble(napi_env env, napi_value obj, const char* key, double value)
{
    napi_value val;
    napi_create_double(env, value, &val);
    napi_set_named_property(env, obj, key, val);
}

inline void napiSetBool(napi_env env, napi_value obj, const char* key, bool value)
{
    napi_value val;
    napi_get_boolean(env, value, &val);
    napi_set_named_property(env, obj, key, val);
}
