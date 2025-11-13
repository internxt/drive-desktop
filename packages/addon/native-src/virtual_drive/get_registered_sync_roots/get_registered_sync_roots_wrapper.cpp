#include <locale>
#include <codecvt>
#include <windows.h>
#include <node_api.h>
#include "get_registered_sync_roots.h"

std::string WStringToUTF8(const std::wstring &wstr) {
    std::wstring_convert<std::codecvt_utf8<wchar_t>> conv;
    return conv.to_bytes(wstr);
}

void add_string_property(napi_env env, napi_value obj, const char* key, const std::wstring& value) {
    std::string utf8Value = WStringToUTF8(value);
    napi_value napiValue;
    napi_create_string_utf8(env, utf8Value.c_str(), utf8Value.size(), &napiValue);
    napi_set_named_property(env, obj, key, napiValue);
}

napi_value get_registered_sync_roots_wrapper(napi_env env, napi_callback_info args) {
    std::vector<SyncRoots> roots = get_registered_sync_roots();

    napi_value jsArray;
    napi_create_array_with_length(env, roots.size(), &jsArray);

    for (size_t i = 0; i < roots.size(); i++) {
        napi_value jsObj;
        napi_create_object(env, &jsObj);

        add_string_property(env, jsObj, "id", roots[i].id);
        add_string_property(env, jsObj, "path", roots[i].path);
        add_string_property(env, jsObj, "displayName", roots[i].displayName);
        add_string_property(env, jsObj, "version", roots[i].version);

        napi_set_element(env, jsArray, i, jsObj);
    }

    return jsArray;
}
