#pragma once

#include <ShlObj.h>
#include <atlbase.h>
#include <exdisp.h>
#include <exdispid.h>
#include <external.h>
#include <shlguid.h>

#include <set>
#include <string>
#include <thread>

static napi_threadsafe_function g_explorerTsfn = nullptr;
static IShellWindows* g_shellWindows = nullptr;
static std::set<IUnknown*> g_advisedWindows;

inline void explorerFire(const std::wstring& path)
{
    napi_call_threadsafe_function(g_explorerTsfn, new std::wstring(path), napi_tsfn_nonblocking);
}

inline void callExplorerJsCallback(napi_env env, napi_value jsCallback, void*, void* data)
{
    auto* path = static_cast<std::wstring*>(data);
    napi_value str, undef;
    napi_create_string_utf16(env, (char16_t*)path->c_str(), path->size(), &str);
    napi_get_undefined(env, &undef);
    napi_call_function(env, undef, jsCallback, 1, &str, nullptr);
    delete path;
}

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

inline void adviseNavigation(IDispatch* dispatch);

// ---- COM sinks ----

struct DispatchBase : IDispatch {
    HRESULT STDMETHODCALLTYPE GetTypeInfoCount(UINT* p) override
    {
        *p = 0;
        return S_OK;
    }
    HRESULT STDMETHODCALLTYPE GetTypeInfo(UINT, LCID, ITypeInfo**) override { return E_NOTIMPL; }
    HRESULT STDMETHODCALLTYPE GetIDsOfNames(REFIID, LPOLESTR*, UINT, LCID, DISPID*) override { return E_NOTIMPL; }
};

struct NavigationSink : DispatchBase {
    std::atomic<ULONG> ref{1};
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IDispatch) {
            *ppv = this;
            AddRef();
            return S_OK;
        }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return ++ref; }
    ULONG STDMETHODCALLTYPE Release() override
    {
        ULONG r = --ref;
        if (!r) delete this;
        return r;
    }
    HRESULT STDMETHODCALLTYPE Invoke(DISPID id, REFIID, LCID, WORD, DISPPARAMS* p, VARIANT*, EXCEPINFO*, UINT*) override
    {
        if (id != DISPID_NAVIGATECOMPLETE2 || !p || p->cArgs < 2 || p->rgvarg[1].vt != VT_DISPATCH) return S_OK;
        try {
            explorerFire(getPathFromDispatch(p->rgvarg[1].pdispVal));
        } catch (...) {
            wprintf(L"[explorer] navigation error\n");
        }
        return S_OK;
    }
};

inline void adviseNavigation(IDispatch* dispatch)
{
    CComPtr<IUnknown> id;
    winrt::check_hresult(dispatch->QueryInterface(IID_IUnknown, (void**)&id));
    if (!g_advisedWindows.insert(id.p).second) return;

    CComQIPtr<IConnectionPointContainer> cpc(dispatch);
    if (!cpc) winrt::check_hresult(E_NOINTERFACE);
    CComPtr<IConnectionPoint> cp;
    winrt::check_hresult(cpc->FindConnectionPoint(DIID_DWebBrowserEvents2, &cp));

    auto* sink = new NavigationSink();
    DWORD cookie = 0;
    HRESULT hr = cp->Advise(sink, &cookie);
    sink->Release();
    winrt::check_hresult(hr);
}

struct ShellWindowsSink : DispatchBase {
    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IDispatch) {
            *ppv = this;
            return S_OK;
        }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }
    ULONG STDMETHODCALLTYPE AddRef() override { return 1; }
    ULONG STDMETHODCALLTYPE Release() override { return 1; }
    HRESULT STDMETHODCALLTYPE Invoke(DISPID dispId, REFIID, LCID, WORD, DISPPARAMS*, VARIANT*, EXCEPINFO*, UINT*) override
    {
        if (dispId != DISPID_WINDOWREGISTERED) return S_OK;
        long count = 0;
        g_shellWindows->get_Count(&count);
        for (long i = 0; i < count; i++) {
            try {
                CComVariant idx(i);
                CComPtr<IDispatch> dispatch;
                if (FAILED(g_shellWindows->Item(idx, &dispatch)) || !dispatch) continue;
                CComPtr<IUnknown> id;
                if (FAILED(dispatch->QueryInterface(IID_IUnknown, (void**)&id)) || g_advisedWindows.count(id.p)) continue;
                adviseNavigation(dispatch);
                explorerFire(getPathFromDispatch(dispatch));
            } catch (...) {
                wprintf(L"[explorer] window register error\n");
            }
        }
        return S_OK;
    }
} g_shellWindowsSink;

// ---- entry point ----

inline napi_value WatchFileExplorersWrapper(napi_env env, napi_callback_info info)
{
    auto [onEventCallback] = napi_extract_args<napi_value>(env, info);
    g_explorerTsfn = registerThreadsafeCallback("WatchFileExplorersCallback", env, onEventCallback, callExplorerJsCallback);
    napi_unref_threadsafe_function(env, g_explorerTsfn);

    std::thread([]() {
        try {
            winrt::check_hresult(CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED));
            winrt::check_hresult(CoCreateInstance(CLSID_ShellWindows, nullptr, CLSCTX_ALL, IID_IShellWindows, (void**)&g_shellWindows));

            CComQIPtr<IConnectionPointContainer> cpc(g_shellWindows);
            if (!cpc) winrt::check_hresult(E_NOINTERFACE);
            CComPtr<IConnectionPoint> cp;
            winrt::check_hresult(cpc->FindConnectionPoint(DIID_DShellWindowsEvents, &cp));

            long count = 0;
            g_shellWindows->get_Count(&count);
            for (long i = 0; i < count; i++) {
                try {
                    CComVariant idx(i);
                    CComPtr<IDispatch> dispatch;
                    if (SUCCEEDED(g_shellWindows->Item(idx, &dispatch)) && dispatch)
                        adviseNavigation(dispatch);
                } catch (...) {
                    wprintf(L"[explorer] startup advise error\n");
                }
            }

            DWORD cookie = 0;
            winrt::check_hresult(cp->Advise(&g_shellWindowsSink, &cookie));

            MSG msg;
            while (GetMessage(&msg, nullptr, 0, 0) > 0) {
                TranslateMessage(&msg);
                DispatchMessage(&msg);
            }
        } catch (...) {
            wprintf(L"[explorer] fatal error\n");
        }
        CoUninitialize();
    }).detach();

    return nullptr;
}
