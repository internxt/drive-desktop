// Windows Shell interfaces such as IExplorerCommand and IShellItemArray.
#include <shobjidl_core.h>
// Shell drag-drop helpers used by the classic Windows 10 IContextMenu path.
#include <shellapi.h>
// Defines NTSTATUS, which is used by structures declared in cfapi.h.
#include <winternl.h>
// Cloud Files API. Windows uses this API to expose which sync provider owns
// a file or folder inside a registered sync root.
#include <cfapi.h>
// Shell helper functions. We use SHStrDupW to return strings using the
// memory-allocation convention expected by Windows Explorer.
#include <shlwapi.h>
// Windows Runtime Library (WRL). RuntimeClass implements the repetitive COM
// infrastructure, including QueryInterface, AddRef, and Release.
#include <wrl.h>
#include <wrl/client.h>

#include <array>
#include <string>
#include <vector>

#include "resource.h"

// Keep the class declaration readable without repeating Microsoft::WRL.
using Microsoft::WRL::ClassicCom;
using Microsoft::WRL::ComPtr;
using Microsoft::WRL::InProc;
using Microsoft::WRL::Module;
using Microsoft::WRL::RuntimeClass;
using Microsoft::WRL::RuntimeClassFlags;

namespace {

constexpr WCHAR ContextMenuPipePath[] =
    L"\\\\.\\pipe\\internxt-drive-context-menu";
HMODULE ContextMenuModule = nullptr;
HBITMAP ContextMenuBitmap = nullptr;

const WCHAR* GetLocalizedCommandTitle()
{
    switch (PRIMARYLANGID(GetUserDefaultUILanguage())) {
        case LANG_SPANISH:
            return L"Copiar enlace compartido de Internxt";
        case LANG_FRENCH:
            return L"Copier le lien de partage Internxt";
        case LANG_GERMAN:
            return L"Internxt-Freigabelink kopieren";
        default:
            return L"Copy Internxt share link";
    }
}

// Explorer passes the current selection as an IShellItemArray. The share
// command supports one item, so this helper rejects empty or multi-selection
// menus and extracts the selected item's normal filesystem path.
bool TryGetSingleSelectedPath(IShellItemArray* items, std::wstring& path)
{
    if (!items) return false;

    DWORD count = 0;
    if (FAILED(items->GetCount(&count)) || count != 1) return false;

    ComPtr<IShellItem> item;
    if (FAILED(items->GetItemAt(0, &item))) return false;

    PWSTR rawPath = nullptr;
    if (FAILED(item->GetDisplayName(SIGDN_FILESYSPATH, &rawPath))) return false;

    path.assign(rawPath);
    CoTaskMemFree(rawPath);
    return true;
}

// CfGetSyncRootInfoByPath returns the sync root's registered Id in ProviderName,
// not its user-facing DisplayNameResource. Resolve that Id through the same
// SyncRootManager metadata Windows creates when Internxt registers the root.
bool TryReadSyncRootDisplayName(HKEY rootKey, const std::wstring& registryPath, std::array<WCHAR, 256>& displayName)
{
    DWORD displayNameSize = static_cast<DWORD>(displayName.size() * sizeof(WCHAR));
    const LSTATUS result = RegGetValueW(
        rootKey,
        registryPath.c_str(),
        L"DisplayNameResource",
        RRF_RT_REG_SZ,
        nullptr,
        displayName.data(),
        &displayNameSize);

    return result == ERROR_SUCCESS;
}

bool IsInternxtProvider(const WCHAR* providerId)
{
    const std::wstring registryPath =
        L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\SyncRootManager\\" +
        std::wstring(providerId);

    std::array<WCHAR, 256> displayName{};
    const bool foundDisplayName =
        TryReadSyncRootDisplayName(HKEY_LOCAL_MACHINE, registryPath, displayName) ||
        TryReadSyncRootDisplayName(HKEY_CURRENT_USER, registryPath, displayName);

    if (!foundDisplayName) return false;

    const std::wstring resolvedDisplayName(displayName.data());
    return resolvedDisplayName == L"Internxt Drive" ||
           resolvedDisplayName == L"Internxt Drive for Business";
}

// Asking Windows which sync root owns the path avoids relying on a hard-coded
// folder location, which differs between users and can change over time.
bool IsInternxtSyncRootItem(const std::wstring& path)
{
    CF_SYNC_ROOT_PROVIDER_INFO providerInfo{};
    const HRESULT result = CfGetSyncRootInfoByPath(
        path.c_str(),
        CF_SYNC_ROOT_INFO_PROVIDER,
        &providerInfo,
        sizeof(providerInfo),
        nullptr);

    if (FAILED(result)) return false;

    return IsInternxtProvider(providerInfo.ProviderName);
}

// A child item and its parent are both owned by the Internxt sync root. For
// the sync root itself, its parent is outside Internxt. Requiring both paths
// therefore hides the command on the root without hard-coding its location.
bool IsInternxtSyncRootDescendant(const std::wstring& path)
{
    std::array<WCHAR, 32768> parentPathBuffer{};
    if (path.size() >= parentPathBuffer.size()) return false;

    wcscpy_s(parentPathBuffer.data(), parentPathBuffer.size(), path.c_str());
    if (!PathRemoveFileSpecW(parentPathBuffer.data())) return false;

    const std::wstring parentPath(parentPathBuffer.data());
    return !parentPath.empty() && parentPath != path && IsInternxtSyncRootItem(parentPath);
}

// Electron owns the named-pipe server. The command writes only the selected
// UTF-16 path and closes the connection; it does not wait for link generation
// or any response from Electron.
void SendSelectedPathToElectron(const std::wstring& selectedPath)
{
    const HANDLE pipe = CreateFileW(
        ContextMenuPipePath,
        GENERIC_WRITE,
        0,
        nullptr,
        OPEN_EXISTING,
        0,
        nullptr);

    if (pipe == INVALID_HANDLE_VALUE) return;

    const DWORD messageSize =
        static_cast<DWORD>(selectedPath.size() * sizeof(WCHAR));
    DWORD bytesWritten = 0;
    WriteFile(
        pipe,
        selectedPath.data(),
        messageSize,
        &bytesWritten,
        nullptr);
    CloseHandle(pipe);
}

HBITMAP GetContextMenuBitmap()
{
    if (ContextMenuBitmap) return ContextMenuBitmap;

    const int iconSize = GetSystemMetrics(SM_CXSMICON);
    HICON icon = static_cast<HICON>(LoadImageW(
        ContextMenuModule,
        MAKEINTRESOURCEW(IDI_CONTEXT_MENU_ICON),
        IMAGE_ICON,
        iconSize,
        iconSize,
        LR_DEFAULTCOLOR));

    if (!icon) return nullptr;

    HDC screenDc = GetDC(nullptr);
    HDC memoryDc = CreateCompatibleDC(screenDc);
    HBITMAP bitmap = CreateCompatibleBitmap(screenDc, iconSize, iconSize);
    HGDIOBJ previousBitmap = SelectObject(memoryDc, bitmap);

    RECT rect{0, 0, iconSize, iconSize};
    FillRect(memoryDc, &rect, reinterpret_cast<HBRUSH>(COLOR_MENU + 1));
    DrawIconEx(memoryDc, 0, 0, icon, iconSize, iconSize, 0, nullptr, DI_NORMAL);

    SelectObject(memoryDc, previousBitmap);
    DeleteDC(memoryDc);
    ReleaseDC(nullptr, screenDc);
    DestroyIcon(icon);

    ContextMenuBitmap = bitmap;
    return ContextMenuBitmap;
}

} // namespace

// The UUID is the permanent COM identity of this command. Windows registration
// will refer to this same value when we add registration in a later step.
class __declspec(uuid("F47A034D-852C-4F60-B721-C31C854183F2")) InternxtPublicLinkShareCommand final
    // RuntimeClass supplies COM lifetime/interface behavior. IExplorerCommand
    // is the contract Explorer calls to render and execute a menu command.
    : public RuntimeClass<RuntimeClassFlags<ClassicCom>, IExplorerCommand, IShellExtInit, IContextMenu> {
public:
    // Windows 10 legacy shell path. Explorer calls Initialize before showing
    // the classic context menu and provides the selected items through
    // IDataObject/CF_HDROP rather than IShellItemArray.
    IFACEMETHODIMP Initialize(LPCITEMIDLIST, IDataObject* dataObject, HKEY) override
    {
        legacySelectedPath_.clear();
        legacyCommandVisible_ = false;

        if (!dataObject) return S_OK;

        FORMATETC format{};
        format.cfFormat = CF_HDROP;
        format.ptd = nullptr;
        format.dwAspect = DVASPECT_CONTENT;
        format.lindex = -1;
        format.tymed = TYMED_HGLOBAL;

        STGMEDIUM storage{};
        if (FAILED(dataObject->GetData(&format, &storage))) return S_OK;

        const HDROP drop = static_cast<HDROP>(GlobalLock(storage.hGlobal));
        if (drop) {
            const UINT count = DragQueryFileW(drop, 0xFFFFFFFF, nullptr, 0);
            if (count == 1) {
                const UINT pathLength = DragQueryFileW(drop, 0, nullptr, 0);
                std::vector<WCHAR> buffer(static_cast<size_t>(pathLength) + 1);
                if (DragQueryFileW(drop, 0, buffer.data(), static_cast<UINT>(buffer.size())) > 0) {
                    legacySelectedPath_.assign(buffer.data());
                    legacyCommandVisible_ = IsInternxtSyncRootDescendant(legacySelectedPath_);
                }
            }

            GlobalUnlock(storage.hGlobal);
        }

        ReleaseStgMedium(&storage);
        return S_OK;
    }

    // Windows 10 legacy shell path. Explorer gives us the menu handle and the
    // insertion index; we add one command only when the selected item belongs
    // to an Internxt sync-root child.
    IFACEMETHODIMP QueryContextMenu(HMENU menu, UINT indexMenu, UINT commandIdFirst, UINT, UINT flags) override
    {
        if ((flags & CMF_DEFAULTONLY) || !legacyCommandVisible_) {
            return MAKE_HRESULT(SEVERITY_SUCCESS, 0, 0);
        }

        if (!InsertMenuW(
                menu,
                indexMenu,
                MF_BYPOSITION | MF_STRING,
                commandIdFirst,
                GetLocalizedCommandTitle())) {
            return HRESULT_FROM_WIN32(GetLastError());
        }

        MENUITEMINFOW menuItemInfo{};
        menuItemInfo.cbSize = sizeof(menuItemInfo);
        menuItemInfo.fMask = MIIM_BITMAP;
        menuItemInfo.hbmpItem = GetContextMenuBitmap();

        if (menuItemInfo.hbmpItem) {
            SetMenuItemInfoW(menu, commandIdFirst, FALSE, &menuItemInfo);
        }

        return MAKE_HRESULT(SEVERITY_SUCCESS, 0, 1);
    }

    // Windows 10 legacy shell path. Explorer calls this after the user clicks
    // the inserted command. Command id 0 is the only verb this handler adds.
    IFACEMETHODIMP InvokeCommand(LPCMINVOKECOMMANDINFO commandInfo) override
    {
        if (!commandInfo) return E_INVALIDARG;

        if (HIWORD(commandInfo->lpVerb) != 0 || LOWORD(commandInfo->lpVerb) != 0) {
            return E_FAIL;
        }

        if (!legacySelectedPath_.empty() && IsInternxtSyncRootDescendant(legacySelectedPath_)) {
            SendSelectedPathToElectron(legacySelectedPath_);
        }

        return S_OK;
    }

    // Windows 10 legacy shell path. We do not expose status-bar help text or
    // canonical verb strings for this command.
    IFACEMETHODIMP GetCommandString(UINT_PTR, UINT, UINT*, LPSTR, UINT) override
    {
        return E_NOTIMPL;
    }

    // Windows calls this to obtain the text displayed in the context menu.
    // The first parameter contains selected items but is not needed for a
    // constant title, so its variable name is intentionally omitted.
    IFACEMETHODIMP GetTitle(IShellItemArray*, PWSTR* title) override
    {
        // SHStrDupW allocates a copy for Explorer. The L prefix creates a
        // UTF-16 string, which is the native Windows string representation.
        return SHStrDupW(GetLocalizedCommandTitle(), title);
    }

    // Explorer expects an icon location in the form "module-path,-resource-id".
    // The Internxt icon is embedded in this DLL, so no separate icon file must
    // be located at runtime.
    IFACEMETHODIMP GetIcon(IShellItemArray*, PWSTR* icon) override
    {
        if (!icon) return E_POINTER;

        std::array<WCHAR, 32768> modulePath{};
        const DWORD length = GetModuleFileNameW(
            ContextMenuModule,
            modulePath.data(),
            static_cast<DWORD>(modulePath.size()));

        if (length == 0 || length == modulePath.size()) {
            *icon = nullptr;
            return HRESULT_FROM_WIN32(GetLastError());
        }

        const std::wstring iconLocation =
            std::wstring(modulePath.data(), length) + L",-" +
            std::to_wstring(IDI_CONTEXT_MENU_ICON);
        return SHStrDupW(iconLocation.c_str(), icon);
    }

    // No tooltip is provided yet.
    IFACEMETHODIMP GetToolTip(IShellItemArray*, PWSTR* tooltip) override
    {
        *tooltip = nullptr;
        return E_NOTIMPL;
    }

    // Returns the stable identity of this command. __uuidof reads the UUID
    // declared on InternxtPublicLinkShareCommand above.
    IFACEMETHODIMP GetCanonicalName(GUID* commandName) override
    {
        *commandName = __uuidof(InternxtPublicLinkShareCommand);
        return S_OK;
    }

    // Explorer calls this before rendering the menu. The DLL is registered for
    // files and folders globally, so this runtime check is what limits the
    // visible command to items owned by an Internxt sync root.
    IFACEMETHODIMP GetState(IShellItemArray* items, BOOL, EXPCMDSTATE* state) override
    {
        if (!state) return E_POINTER;

        std::wstring selectedPath;
        *state = TryGetSingleSelectedPath(items, selectedPath) &&
                         IsInternxtSyncRootDescendant(selectedPath)
                     ? ECS_ENABLED
                     : ECS_HIDDEN;
        return S_OK;
    }

    // File Explorer calls Invoke after the user clicks the command. This layer only
    // forwards the selected path; Electron owns the sharing workflow.
    IFACEMETHODIMP Invoke(IShellItemArray* items, IBindCtx*) override
    {
        std::wstring selectedPath;
        if (TryGetSingleSelectedPath(items, selectedPath) && IsInternxtSyncRootDescendant(selectedPath)) {
            SendSelectedPathToElectron(selectedPath);
        }

        return S_OK;
    }

    // The command has no special Explorer behavior.
    IFACEMETHODIMP GetFlags(EXPCMDFLAGS* flags) override
    {
        *flags = ECF_DEFAULT;
        return S_OK;
    }

    // This is a single command rather than a parent menu with child commands.
    IFACEMETHODIMP EnumSubCommands(IEnumExplorerCommand** commands) override
    {
        *commands = nullptr;
        return E_NOTIMPL;
    }

private:
    std::wstring legacySelectedPath_;
    bool legacyCommandVisible_ = false;
};

// Adds this class to WRL's internal map of COM classes. When Explorer asks the
// DLL for the UUID above, WRL uses this map to construct the correct class.
CoCreatableClass(InternxtPublicLinkShareCommand)

// Windows calls this once when it loads or unloads the DLL. We currently have
// no initialization or cleanup work. Disabling thread notifications avoids
// unnecessary callbacks whenever Explorer creates or destroys a thread.
BOOL APIENTRY DllMain(HMODULE module, DWORD reason, LPVOID)
{
    if (reason == DLL_PROCESS_ATTACH) {
        ContextMenuModule = module;
        DisableThreadLibraryCalls(module);
    } else if (reason == DLL_PROCESS_DETACH && ContextMenuBitmap) {
        DeleteObject(ContextMenuBitmap);
        ContextMenuBitmap = nullptr;
    }

    return TRUE;
}

// Explorer calls this export to request the factory that creates the COM class
// identified by classId. WRL implements the factory using CoCreatableClass.
STDAPI DllGetClassObject(REFCLSID classId, REFIID interfaceId, void** object)
{
    if (!object) return E_POINTER;

    *object = nullptr;
    return Module<InProc>::GetModule().GetClassObject(classId, interfaceId, object);
}

// Explorer calls this export before unloading the DLL. S_OK means there are no
// live command objects; S_FALSE means the DLL must remain loaded.
STDAPI DllCanUnloadNow()
{
    return Module<InProc>::GetModule().GetObjectCount() == 0 ? S_OK : S_FALSE;
}
