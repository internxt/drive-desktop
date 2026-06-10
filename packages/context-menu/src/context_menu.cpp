// Windows Shell interfaces such as IExplorerCommand and IShellItemArray.
#include <shobjidl_core.h>
// Shell helper functions. We use SHStrDupW to return strings using the
// memory-allocation convention expected by Windows Explorer.
#include <shlwapi.h>
// Windows Runtime Library (WRL). RuntimeClass implements the repetitive COM
// infrastructure, including QueryInterface, AddRef, and Release.
#include <wrl.h>

// Keep the class declaration readable without repeating Microsoft::WRL.
using Microsoft::WRL::ClassicCom;
using Microsoft::WRL::InProc;
using Microsoft::WRL::Module;
using Microsoft::WRL::RuntimeClass;
using Microsoft::WRL::RuntimeClassFlags;

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

    // Explorer calls this before rendering the menu to determine whether the
    // command should be enabled. For now, exactly one selected item is enough.
    IFACEMETHODIMP GetState(IShellItemArray* items, BOOL, EXPCMDSTATE* state) override
    {
        DWORD count = 0;
        *state = items && SUCCEEDED(items->GetCount(&count)) && count == 1 ? ECS_ENABLED : ECS_DISABLED;
        return S_OK;
    }

    // Explorer calls Invoke after the user clicks the command. It intentionally
    // performs no action in this first, reviewable implementation step.
    IFACEMETHODIMP Invoke(IShellItemArray*, IBindCtx*) override
    { // TODO: The implementation of the actual logic of the command belongs here
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
