// Windows Shell interfaces such as IExplorerCommand and IShellItemArray.
#include <shobjidl_core.h>
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
bool IsInternxtProvider(const WCHAR* providerId)
{
    const std::wstring registryPath =
        L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Explorer\\SyncRootManager\\" +
        std::wstring(providerId);

    std::array<WCHAR, 256> displayName{};
    DWORD displayNameSize = static_cast<DWORD>(displayName.size() * sizeof(WCHAR));
    const LSTATUS result = RegGetValueW(
        HKEY_LOCAL_MACHINE,
        registryPath.c_str(),
        L"DisplayNameResource",
        RRF_RT_REG_SZ,
        nullptr,
        displayName.data(),
        &displayNameSize);

    if (result != ERROR_SUCCESS) return false;

    return std::wstring(displayName.data()) == L"Internxt Drive" ||
           std::wstring(displayName.data()) == L"Internxt Drive for Business";
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

} // namespace

// The UUID is the permanent COM identity of this command. Windows registration
// will refer to this same value when we add registration in a later step.
class __declspec(uuid("F47A034D-852C-4F60-B721-C31C854183F2")) InternxtPublicLinkShareCommand final
    // RuntimeClass supplies COM lifetime/interface behavior. IExplorerCommand
    // is the contract Explorer calls to render and execute a menu command.
    : public RuntimeClass<RuntimeClassFlags<ClassicCom>, IExplorerCommand> {
public:
    // Windows calls this to obtain the text displayed in the context menu.
    // The first parameter contains selected items but is not needed for a
    // constant title, so its variable name is intentionally omitted.
    IFACEMETHODIMP GetTitle(IShellItemArray*, PWSTR* title) override
    { // TODO: Translations from en, es, fr, de.
        // SHStrDupW allocates a copy for Explorer. The L prefix creates a
        // UTF-16 string, which is the native Windows string representation.
        return SHStrDupW(L"Copy Internxt share link", title);
    }

    // No icon is provided in this first step. E_NOTIMPL tells Explorer to use
    // its default behavior instead of treating this as an error.
    IFACEMETHODIMP GetIcon(IShellItemArray*, PWSTR* icon) override
    {
        // TODO: Provide an icon in a future implementation step. For now, return
        *icon = nullptr;
        return E_NOTIMPL;
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
                         IsInternxtSyncRootItem(selectedPath)
                     ? ECS_ENABLED
                     : ECS_HIDDEN;
        return S_OK;
    }

    // File Explorer calls Invoke after the user clicks the command. This layer only
    // forwards the selected path; Electron owns the sharing workflow.
    IFACEMETHODIMP Invoke(IShellItemArray* items, IBindCtx*) override
    {
        std::wstring selectedPath;
        if (TryGetSingleSelectedPath(items, selectedPath) && IsInternxtSyncRootItem(selectedPath)) {
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
        DisableThreadLibraryCalls(module);
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
