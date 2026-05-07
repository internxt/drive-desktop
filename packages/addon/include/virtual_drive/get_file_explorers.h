#pragma once

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

inline std::vector<std::wstring> getFileExplorers()
{
    HRESULT coHr = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    winrt::check_hresult(coHr);

    CComPtr<IShellWindows> shellWindows;
    winrt::check_hresult(CoCreateInstance(CLSID_ShellWindows, nullptr, CLSCTX_ALL, IID_IShellWindows, (void**)&shellWindows));

    long count = 0;
    shellWindows->get_Count(&count);

    std::vector<std::wstring> paths;
    for (long i = 0; i < count; i++) {
        try {
            CComVariant idx(i);
            CComPtr<IDispatch> dispatch;
            shellWindows->Item(idx, &dispatch);

            std::wstring path = getPathFromDispatch(dispatch);
            if (!path.empty()) {
                paths.push_back(std::move(path));
            }
        } catch (...) {
        }
    }

    CoUninitialize();
    return paths;
}

inline napi_value getFileExplorersWrapper(napi_env env, napi_callback_info)
{
    return run_async(env, "GetFileExplorers", getFileExplorers);
}

inline napi_value GetFileExplorersWrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, getFileExplorersWrapper);
}
