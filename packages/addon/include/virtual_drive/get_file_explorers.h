#pragma once

#include <ShlObj.h>
#include <atlbase.h>
#include <exdisp.h>
#include <external.h>
#include <shlguid.h>

inline std::wstring getPathFromDispatch(IDispatch* dispatch)
{
    CComQIPtr<IWebBrowserApp> app(dispatch);
    if (!app) winrt::check_hresult(E_NOINTERFACE);

    CComQIPtr<IServiceProvider> sp(app);
    if (!sp) winrt::check_hresult(E_NOINTERFACE);

    CComPtr<IShellBrowser> sb;
    winrt::check_hresult(sp->QueryService(SID_STopLevelBrowser, IID_IShellBrowser, (void**)&sb));

    CComPtr<IShellView> sv;
    winrt::check_hresult(sb->QueryActiveShellView(&sv));

    CComQIPtr<IFolderView> fv(sv);
    if (!fv) winrt::check_hresult(E_NOINTERFACE);

    CComPtr<IPersistFolder2> pf;
    winrt::check_hresult(fv->GetFolder(IID_IPersistFolder2, (void**)&pf));

    LPITEMIDLIST pidl = nullptr;
    winrt::check_hresult(pf->GetCurFolder(&pidl));

    wchar_t path[MAX_PATH] = {};
    BOOL ok = SHGetPathFromIDListW(pidl, path);
    CoTaskMemFree(pidl);
    if (!ok) return {};

    return path;
}

inline napi_value getFileExplorers(napi_env env, napi_callback_info)
{
    CComPtr<IShellWindows> shellWindows;
    winrt::check_hresult(CoCreateInstance(CLSID_ShellWindows, nullptr, CLSCTX_ALL, IID_IShellWindows, (void**)&shellWindows));

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
            if (path.empty()) continue;

            napi_value str;
            napi_create_string_utf16(env, (char16_t*)path.c_str(), path.size(), &str);
            napi_set_element(env, result, out++, str);
        } catch (...) {
        }
    }

    return result;
}

inline napi_value GetFileExplorersWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, getFileExplorers);
}
