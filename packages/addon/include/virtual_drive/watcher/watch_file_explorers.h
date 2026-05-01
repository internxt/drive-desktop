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

inline void callExplorerJsCallback(napi_env env, napi_value jsCallback, void*, void* data)
{
    auto* path = static_cast<std::wstring*>(data);

    int utf8Len = WideCharToMultiByte(CP_UTF8, 0, path->c_str(), -1, nullptr, 0, nullptr, nullptr);
    std::string utf8Path(utf8Len - 1, '\0');
    WideCharToMultiByte(CP_UTF8, 0, path->c_str(), -1, utf8Path.data(), utf8Len, nullptr, nullptr);

    napi_value str, undefined;
    napi_create_string_utf8(env, utf8Path.c_str(), utf8Path.size(), &str);
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, 1, &str, nullptr);

    delete path;
}

inline std::wstring getPathFromDispatch(IDispatch* dispatch)
{
    if (!dispatch) return L"";

    CComPtr<IWebBrowserApp> browserApp;
    if (FAILED(dispatch->QueryInterface(IID_IWebBrowserApp, (void**)&browserApp))) return L"";

    CComPtr<IServiceProvider> sp;
    if (FAILED(browserApp->QueryInterface(IID_IServiceProvider, (void**)&sp))) return L"";

    CComPtr<IShellBrowser> sb;
    if (FAILED(sp->QueryService(SID_STopLevelBrowser, IID_IShellBrowser, (void**)&sb))) return L"";

    CComPtr<IShellView> sv;
    if (FAILED(sb->QueryActiveShellView(&sv))) return L"";

    CComPtr<IFolderView> fv;
    if (FAILED(sv->QueryInterface(IID_IFolderView, (void**)&fv))) return L"";

    CComPtr<IPersistFolder2> pf;
    if (FAILED(fv->GetFolder(IID_IPersistFolder2, (void**)&pf))) return L"";

    LPITEMIDLIST pidl = nullptr;
    if (FAILED(pf->GetCurFolder(&pidl))) return L"";

    wchar_t path[MAX_PATH];
    SHGetPathFromIDListW(pidl, path);
    CoTaskMemFree(pidl);

    return path;
}

// Fires tsfn on DWebBrowserEvents2::NavigateComplete2 for a single Explorer window.
// Released automatically by the connection point when the window closes.
class NavigationSink : public IDispatch {
    std::atomic<ULONG> refCount{1};

public:
    napi_threadsafe_function tsfn = nullptr;

    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IDispatch) { *ppv = this; AddRef(); return S_OK; }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }

    ULONG STDMETHODCALLTYPE AddRef() override { return ++refCount; }
    ULONG STDMETHODCALLTYPE Release() override { ULONG r = --refCount; if (!r) delete this; return r; }

    HRESULT STDMETHODCALLTYPE GetTypeInfoCount(UINT* p) override { *p = 0; return S_OK; }
    HRESULT STDMETHODCALLTYPE GetTypeInfo(UINT, LCID, ITypeInfo**) override { return E_NOTIMPL; }
    HRESULT STDMETHODCALLTYPE GetIDsOfNames(REFIID, LPOLESTR*, UINT, LCID, DISPID*) override { return E_NOTIMPL; }

    HRESULT STDMETHODCALLTYPE Invoke(
        DISPID dispId, REFIID, LCID, WORD,
        DISPPARAMS* p, VARIANT*, EXCEPINFO*, UINT*) override
    {
        if (dispId != DISPID_NAVIGATECOMPLETE2 || !p || p->cArgs < 2) return S_OK;
        if (p->rgvarg[1].vt != VT_DISPATCH) return S_OK;

        std::wstring path = getPathFromDispatch(p->rgvarg[1].pdispVal);
        if (!path.empty())
            napi_call_threadsafe_function(tsfn, new std::wstring(path), napi_tsfn_blocking);

        return S_OK;
    }
};

// Listens to DShellWindowsEvents and hooks a NavigationSink onto each new Explorer window.
class ShellWindowsSink : public IDispatch {
    std::atomic<ULONG> refCount{1};
    std::set<IUnknown*> advisedWindows;  // raw ptrs for dedup only, no addref needed

public:
    void adviseWindow(IDispatch* dispatch)
    {
        if (!dispatch) return;

        CComPtr<IUnknown> id;
        if (FAILED(dispatch->QueryInterface(IID_IUnknown, (void**)&id)) || !id) return;
        if (!advisedWindows.insert(id.p).second) return;  // already advised

        CComPtr<IConnectionPointContainer> cpc;
        if (FAILED(dispatch->QueryInterface(IID_IConnectionPointContainer, (void**)&cpc))) return;

        CComPtr<IConnectionPoint> cp;
        if (FAILED(cpc->FindConnectionPoint(DIID_DWebBrowserEvents2, &cp))) return;

        auto* sink = new NavigationSink();
        sink->tsfn = tsfn;

        DWORD cookie = 0;
        if (FAILED(cp->Advise(sink, &cookie)))
            sink->Release();
        // cp and cookie not stored — window closing releases the sink via COM
    }

public:
    IShellWindows* shellWindows = nullptr;
    napi_threadsafe_function tsfn = nullptr;

    HRESULT STDMETHODCALLTYPE QueryInterface(REFIID riid, void** ppv) override
    {
        if (riid == IID_IUnknown || riid == IID_IDispatch) { *ppv = this; AddRef(); return S_OK; }
        *ppv = nullptr;
        return E_NOINTERFACE;
    }

    ULONG STDMETHODCALLTYPE AddRef() override { return ++refCount; }
    ULONG STDMETHODCALLTYPE Release() override { ULONG r = --refCount; if (!r) delete this; return r; }

    HRESULT STDMETHODCALLTYPE GetTypeInfoCount(UINT* p) override { *p = 0; return S_OK; }
    HRESULT STDMETHODCALLTYPE GetTypeInfo(UINT, LCID, ITypeInfo**) override { return E_NOTIMPL; }
    HRESULT STDMETHODCALLTYPE GetIDsOfNames(REFIID, LPOLESTR*, UINT, LCID, DISPID*) override { return E_NOTIMPL; }

    HRESULT STDMETHODCALLTYPE Invoke(
        DISPID dispId, REFIID, LCID, WORD,
        DISPPARAMS*, VARIANT*, EXCEPINFO*, UINT*) override
    {
        if (dispId != 200) return S_OK;  // only WindowRegistered

        long count = 0;
        shellWindows->get_Count(&count);

        for (long i = 0; i < count; i++) {
            CComVariant idx(i);
            CComPtr<IDispatch> dispatch;
            if (FAILED(shellWindows->Item(idx, &dispatch)) || !dispatch) continue;

            adviseWindow(dispatch);

            std::wstring path = getPathFromDispatch(dispatch);
            if (!path.empty())
                napi_call_threadsafe_function(tsfn, new std::wstring(path), napi_tsfn_blocking);
        }

        return S_OK;
    }
};

inline napi_value WatchFileExplorersWrapper(napi_env env, napi_callback_info info)
{
    auto [onEventCallback] = napi_extract_args<napi_value>(env, info);

    auto tsfn = registerThreadsafeCallback("WatchFileExplorersCallback", env, onEventCallback, callExplorerJsCallback);
    napi_unref_threadsafe_function(env, tsfn);  // don't block Node exit

    std::thread([tsfn]() {
        CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);

        CComPtr<IShellWindows> shellWindows;
        CoCreateInstance(CLSID_ShellWindows, nullptr, CLSCTX_ALL, IID_IShellWindows, (void**)&shellWindows);

        CComPtr<IConnectionPointContainer> cpc;
        shellWindows->QueryInterface(IID_IConnectionPointContainer, (void**)&cpc);

        CComPtr<IConnectionPoint> cp;
        cpc->FindConnectionPoint(DIID_DShellWindowsEvents, &cp);

        auto* sink = new ShellWindowsSink();
        sink->shellWindows = shellWindows;
        sink->tsfn = tsfn;

        // Hook navigation on already-open Explorer windows
        long count = 0;
        shellWindows->get_Count(&count);
        for (long i = 0; i < count; i++) {
            CComVariant idx(i);
            CComPtr<IDispatch> dispatch;
            if (SUCCEEDED(shellWindows->Item(idx, &dispatch)) && dispatch)
                sink->adviseWindow(dispatch);
        }

        DWORD adviseCookie = 0;
        cp->Advise(sink, &adviseCookie);

        MSG msg;
        while (GetMessage(&msg, nullptr, 0, 0) > 0) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }

        CoUninitialize();
    }).detach();

    return nullptr;
}
