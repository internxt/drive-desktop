#pragma once

#include <exdisp.h>
#include <external.h>

#include "dispatch_path.h"

inline napi_value getFileExplorers(napi_env env, napi_callback_info)
{
    CComPtr<IShellWindows> shellWindows;
    CoCreateInstance(CLSID_ShellWindows, nullptr, CLSCTX_ALL, IID_IShellWindows, (void**)&shellWindows);

    long count = 0;
    shellWindows->get_Count(&count);

    napi_value result;
    napi_create_array(env, &result);

    uint32_t out = 0;
    for (long i = 0; i < count; i++) {
        try {
            CComVariant idx(i);
            CComPtr<IDispatch> dispatch;
            shellWindows->Item(idx, &dispatch);

            std::wstring path = getPathFromDispatch(dispatch);
            napi_value pathStr;
            napi_create_string_utf16(env, (char16_t*)path.c_str(), path.size(), &pathStr);
            napi_set_element(env, result, out++, pathStr);
        } catch (...) {
        }
    }

    return result;
}

inline napi_value GetFileExplorersWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, getFileExplorers);
}
