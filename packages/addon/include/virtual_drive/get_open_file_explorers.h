#pragma once

#include <ShlObj.h>
#include <atlbase.h>
#include <exdisp.h>
#include <external.h>

#include <string>
#include <vector>

inline napi_value getOpenFileExplorers(napi_env env, napi_callback_info info)
{
    CComPtr<IShellWindows> shellWindows;
    CoCreateInstance(CLSID_ShellWindows, nullptr, CLSCTX_ALL, IID_IShellWindows, (void**)&shellWindows);

    long count = 0;
    shellWindows->get_Count(&count);

    napi_value result;
    napi_create_array_with_length(env, count, &result);

    for (long i = 0; i < count; i++) {
        CComVariant index(i);
        CComPtr<IDispatch> dispatch;
        CComPtr<IWebBrowserApp> browserApp;
        CComPtr<IServiceProvider> serviceProvider;
        CComPtr<IShellBrowser> shellBrowser;
        CComPtr<IShellView> shellView;
        CComPtr<IFolderView> folderView;
        CComPtr<IPersistFolder2> persistFolder;
        LPITEMIDLIST pidl = nullptr;

        shellWindows->Item(index, &dispatch);
        dispatch->QueryInterface(IID_IWebBrowserApp, (void**)&browserApp);
        browserApp->QueryInterface(IID_IServiceProvider, (void**)&serviceProvider);
        serviceProvider->QueryService(SID_STopLevelBrowser, IID_IShellBrowser, (void**)&shellBrowser);
        shellBrowser->QueryActiveShellView(&shellView);
        shellView->QueryInterface(IID_IFolderView, (void**)&folderView);
        folderView->GetFolder(IID_IPersistFolder2, (void**)&persistFolder);
        persistFolder->GetCurFolder(&pidl);

        wchar_t path[MAX_PATH];
        SHGetPathFromIDListW(pidl, path);
        CoTaskMemFree(pidl);

        int utf8Len = WideCharToMultiByte(CP_UTF8, 0, path, -1, nullptr, 0, nullptr, nullptr);
        std::string utf8Path(utf8Len - 1, '\0');
        WideCharToMultiByte(CP_UTF8, 0, path, -1, utf8Path.data(), utf8Len, nullptr, nullptr);

        napi_value str;
        napi_create_string_utf8(env, utf8Path.c_str(), utf8Path.size(), &str);
        napi_set_element(env, result, i, str);
    }

    return result;
}

inline napi_value GetOpenFileExplorersWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, getOpenFileExplorers);
}