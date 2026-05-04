#pragma once

#include <ShlObj.h>
#include <atlbase.h>
#include <exdisp.h>
#include <external.h>
#include <shlguid.h>

#include <string>

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
    if (!ok) winrt::check_hresult(E_FAIL);

    return path;
}
